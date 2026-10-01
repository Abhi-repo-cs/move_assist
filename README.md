# MoveAssist

A multimodal AI mobility-assistance **research prototype**. Upload or capture an image of your surroundings, ask a question by text or voice, and get a short, hedged description read aloud.

> **Not a medical device. Not a wheelchair controller.** It never controls motors or actuators, does not guarantee obstacle detection, and its output can be wrong. Do not rely on it for physical safety or navigation.

## 1. Overview
MoveAssist is inspired by the design space reviewed in "AI That Moves With You: A Review of Interactive Technologies Powered by Large Foundation Models for Mobility Impairment". It is **not** one of the systems reviewed in that paper.

## 2. Architecture
```
React (Vite, Tailwind)  ->  FastAPI  ->  VisionService  ->  Vision-language model
        ^                                                          |
        +------------ validated JSON (Pydantic) <-----------------+
```
Provider-specific code lives only in `backend/services/vision_service.py` (`VisionService._call_provider`).

## 3. Features
- Image upload (JPG/PNG, 8 MB limit, magic-byte check) and camera capture (capture / retake / use)
- Text or voice questions (Web Speech API), example question chips
- Concise or Detailed responses
- Output separated into **Observed**, **Interpretation**, **Uncertainty**; coarse positions only, no invented distances
- Read aloud (speech synthesis), optional auto-read
- Accessibility: semantic HTML, labelled controls, visible focus, skip link, `aria-live` output, high contrast, reduced-motion safe, Atkinson Hyperlegible typeface
- Status pill (AI Ready / Demo Mode / offline) and persistent safety notice
- Handles: no image, empty question, invalid image, API failure, timeout, camera/mic denied, unsupported speech APIs, malformed model output

## 4. Folder structure
```
moveassist/
├── frontend/src/{components,pages,services,hooks,test}, App.jsx
├── backend/{main.py, models.py, config.py, services/vision_service.py, tests/, requirements.txt, .env.example}
└── README.md
```

## 5. Installation
```bash
cd backend  && pip install -r requirements.txt
cd frontend && npm install
```

## 6. Environment variables (`backend/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `DEMO_MODE` | `true` | Deterministic mock responses, no key needed |
| `MODEL_API_KEY` | empty | Provider API key (never commit) |
| `MODEL_NAME` | `gpt-4o-mini` | Vision-capable model |
| `MODEL_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `MODEL_TIMEOUT_SECONDS` | `30` | Provider timeout |
| `MAX_IMAGE_MB` / `MAX_QUESTION_CHARS` | `8` / `500` | Validation limits |
| `CORS_ORIGINS` | localhost:5173 | Allowed browser origins |

Copy the template first: `cp backend/.env.example backend/.env`

## 7. Run the backend
```bash
cd backend && uvicorn main:app --port 8000
```
## 8. Run the frontend
```bash
cd frontend && npm run dev     # http://localhost:5173 (proxies /api to :8000)
```
Camera needs HTTPS or `localhost`. Voice input works in Chrome/Edge; other browsers show a fallback message.

## 9. Demo Mode
With `DEMO_MODE=true` the whole workflow runs without credentials. Responses are fixed examples chosen by keywords in the question; **they do not analyze the image**. The UI shows a Demo Mode banner, pill, and a "Demo response" tag on each answer.

## 10. AI provider configuration
Set `DEMO_MODE=false`, `MODEL_API_KEY`, `MODEL_NAME`, `MODEL_BASE_URL`. Any OpenAI-compatible chat-completions endpoint that accepts `image_url` data URIs works. For another provider, edit `_call_provider` only.

## 11. API
`GET /api/health` -> `{status, demo_mode, ai_configured, mode_label}`

`POST /api/analyze` (multipart/form-data): `image` (JPG/PNG), `question` (1-500 chars), `response_mode` (`concise`|`detailed`).
```json
{
  "answer": "...",
  "observations": [{"object": "...", "relative_position": "...", "confidence": 0.0}],
  "interpretation": "...",
  "uncertainty": "...",
  "safety_note": "...",
  "demo_mode": false,
  "model": "..."
}
```
Errors return `{"detail": "..."}` with 400 (missing/empty), 413 (too large), 415 (bad type), 502 (provider/malformed output), 503 (unconfigured/rate limited), 504 (timeout). Interactive docs at `/docs`.

## Tests
```bash
cd backend && python -m pytest        # 14 tests
cd frontend && npm test               # 12 tests
```

## 12. Safety limitations
- Output may be wrong, incomplete, or hallucinated; a single still image cannot establish that a path is safe.
- Model confidence values are rough self-estimates, not measurements.
- No depth sensing: the system must not (and is prompted not to) state distances.
- Images are sent to the configured provider when Demo Mode is off; review that provider's data policy.
- Not evaluated with users with mobility impairments; no clinical or safety validation.

## 13. Research connection
Foundation model -> perception + reasoning -> interactive interface -> accessible feedback. MoveAssist explores that flow in a minimal form.

## 14. Future extensions
Live video with frame sampling, user studies with the target community, depth/sensor fusion, multilingual speech, on-device models, caregiver sharing, structured evaluation of hallucination rates.
