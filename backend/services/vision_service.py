"""Provider-isolated vision-language model access.

Only this file knows about any specific provider's wire format. To swap
providers, change `_call_provider` (or subclass VisionService).
"""
import base64
import json
import re
from typing import Optional

import httpx
from pydantic import ValidationError

from config import Settings
from models import AnalysisResult, ResponseMode

SAFETY_NOTE = (
    "AI guidance can be incorrect. Verify the environment independently before moving."
)

SYSTEM_PROMPT = (
    "You are an assistive environmental-description system. Analyze only information "
    "supported by the provided image. Answer the user's question concisely. Clearly "
    "distinguish visible observations from uncertainty. Never invent objects, distances, "
    "directions, or hazards. Do not claim guaranteed safety. When visual information is "
    "insufficient, explicitly say so. Use only coarse relative positions (left, right, "
    "center, near, far); never give numeric distances. Do not reveal your reasoning.\n\n"
    "Respond with ONLY a JSON object, no markdown, in exactly this shape:\n"
    '{"answer": str, "observations": [{"object": str, "relative_position": str, '
    '"confidence": number 0-1}], "interpretation": str, "uncertainty": str, '
    '"safety_note": str}\n'
    "'answer' is what the user hears. 'observations' lists only things clearly visible. "
    "'interpretation' is what those observations might mean for movement, phrased with "
    "hedges like 'may' or 'might'. 'uncertainty' states what the image cannot show."
)

MODE_INSTRUCTIONS = {
    ResponseMode.concise: "Keep 'answer' to 1-2 short sentences.",
    ResponseMode.detailed: (
        "Give a fuller 'answer' (3-5 sentences) with more environmental context, "
        "still without inventing anything."
    ),
}


class VisionServiceError(Exception):
    """Raised for provider failures. `status_code` maps to an HTTP status."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_model_output(text: str) -> AnalysisResult:
    """Parse and validate the model's text into an AnalysisResult."""
    if not text or not text.strip():
        raise VisionServiceError("The model returned an empty response.", 502)
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise VisionServiceError("The model returned a malformed response.", 502)
        try:
            data = json.loads(match.group(0))
        except json.JSONDecodeError:
            raise VisionServiceError("The model returned a malformed response.", 502)
    try:
        result = AnalysisResult.model_validate(data)
    except ValidationError:
        raise VisionServiceError("The model response did not match the expected format.", 502)
    if not result.safety_note.strip():
        result.safety_note = SAFETY_NOTE
    return result


def _demo_result(question: str, mode: ResponseMode) -> AnalysisResult:
    """Deterministic mock. Does NOT look at the image; it only demonstrates the UI."""
    q = question.lower()
    if "doorway" in q or "door" in q:
        answer = "A doorway appears to be visible ahead, slightly right of center."
        detail = " Its edges are not fully clear, so its exact position is uncertain."
    elif "obstacle" in q:
        answer = "One object appears toward the left side of the image. It may partly block the left side of the path."
        detail = " Nothing else is clearly visible as an obstacle, but the image cannot confirm the path is clear."
    elif "object" in q or "around" in q:
        answer = "An object is visible toward the left side, and a doorway appears ahead."
        detail = " These are rough impressions from a single image."
    elif "describe" in q or "environment" in q:
        answer = "This looks like an indoor space with a doorway ahead and an object toward the left."
        detail = " Lighting and framing limit how much can be said with confidence."
    else:
        answer = (
            "A doorway appears to be visible ahead. An object is visible toward the left "
            "side of the image. Verify the environment independently before moving."
        )
        detail = " This is a demonstration response and is not based on your image."
    if mode == ResponseMode.detailed:
        answer += detail
    return AnalysisResult.model_validate(
        {
            "answer": answer,
            "observations": [
                {"object": "doorway", "relative_position": "ahead", "confidence": 0.6},
                {"object": "object", "relative_position": "left", "confidence": 0.5},
            ],
            "interpretation": "The object on the left may partially obstruct that side of the path.",
            "uncertainty": (
                "Demo Mode: this response is a fixed example and does not analyze your image. "
                "A single image cannot show whether the path is safe."
            ),
            "safety_note": SAFETY_NOTE,
        }
    )


class VisionService:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def analyze_image(
        self,
        image: bytes,
        question: str,
        response_mode: ResponseMode = ResponseMode.concise,
        content_type: str = "image/jpeg",
    ) -> AnalysisResult:
        if self.settings.demo_mode:
            return _demo_result(question, response_mode)
        if not self.settings.ai_configured:
            raise VisionServiceError(
                "No AI model is configured. Set MODEL_API_KEY or enable DEMO_MODE.", 503
            )
        text = await self._call_provider(image, question, response_mode, content_type)
        return parse_model_output(text)

    # ---- provider-specific code (OpenAI-compatible chat completions) ----
    async def _call_provider(
        self, image: bytes, question: str, mode: ResponseMode, content_type: str
    ) -> str:
        b64 = base64.b64encode(image).decode("ascii")
        payload = {
            "model": self.settings.model_name,
            "temperature": 0.2,
            "max_tokens": 700,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT + "\n" + MODE_INSTRUCTIONS[mode]},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{content_type};base64,{b64}"},
                        },
                    ],
                },
            ],
        }
        url = self.settings.model_base_url.rstrip("/") + "/chat/completions"
        headers = {"Authorization": f"Bearer {self.settings.model_api_key}"}
        try:
            async with httpx.AsyncClient(timeout=self.settings.model_timeout) as client:
                resp = await client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise VisionServiceError("The AI model took too long to respond.", 504)
        except httpx.HTTPError:
            raise VisionServiceError("Could not reach the AI model.", 502)
        if resp.status_code in (401, 403):
            raise VisionServiceError("The AI provider rejected the API credentials.", 502)
        if resp.status_code == 429:
            raise VisionServiceError("The AI provider is rate limiting requests. Try again shortly.", 503)
        if resp.status_code >= 400:
            raise VisionServiceError(f"The AI provider returned an error ({resp.status_code}).", 502)
        try:
            return resp.json()["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError):
            raise VisionServiceError("The model returned a malformed response.", 502)
