import logging
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from config import Settings, get_settings
from models import AnalyzeResponse, HealthResponse, ResponseMode
from services.vision_service import VisionService, VisionServiceError

logger = logging.getLogger("moveassist")

ALLOWED_TYPES = {"image/jpeg", "image/png"}


def detect_image_type(data: bytes) -> Optional[str]:
    """Check magic bytes so a renamed file can't pass as an image."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    return None


def create_app(settings: Optional[Settings] = None) -> FastAPI:
    cfg = settings or get_settings()
    app = FastAPI(
        title="MoveAssist API",
        description="Research prototype. Not a medical or safety-critical device.",
        version="0.1.0",
    )
    app.state.settings = cfg
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    def get_service() -> VisionService:
        return VisionService(app.state.settings)

    @app.get("/api/health", response_model=HealthResponse)
    def health():
        s = app.state.settings
        label = "Demo Mode" if s.demo_mode else ("AI Ready" if s.ai_configured else "AI Not Configured")
        return HealthResponse(
            status="ok", demo_mode=s.demo_mode, ai_configured=s.ai_configured, mode_label=label
        )

    @app.post("/api/analyze", response_model=AnalyzeResponse)
    async def analyze(
        image: Optional[UploadFile] = File(None),
        question: str = Form(""),
        response_mode: ResponseMode = Form(ResponseMode.concise),
        service: VisionService = Depends(get_service),
    ):
        s = app.state.settings
        q = question.strip()
        if image is None:
            raise HTTPException(400, "Please provide an image.")
        if not q:
            raise HTTPException(400, "Please enter a question.")
        if len(q) > s.max_question_chars:
            raise HTTPException(400, f"Question is too long (max {s.max_question_chars} characters).")
        if image.content_type not in ALLOWED_TYPES:
            raise HTTPException(415, "Unsupported image type. Use a JPG or PNG file.")
        data = await image.read(s.max_image_bytes + 1)
        if len(data) == 0:
            raise HTTPException(400, "The image file is empty.")
        if len(data) > s.max_image_bytes:
            raise HTTPException(413, f"Image is too large (max {s.max_image_bytes // (1024 * 1024)} MB).")
        detected = detect_image_type(data)
        if detected is None:
            raise HTTPException(415, "The file is not a valid JPG or PNG image.")
        try:
            result = await service.analyze_image(data, q, response_mode, detected)
        except VisionServiceError as exc:
            logger.warning("Vision service error: %s", exc.message)
            raise HTTPException(exc.status_code, exc.message)
        return AnalyzeResponse(
            **result.model_dump(),
            demo_mode=s.demo_mode,
            model="demo" if s.demo_mode else s.model_name,
        )

    return app


app = create_app()
