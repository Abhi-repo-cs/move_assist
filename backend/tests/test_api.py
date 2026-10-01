import base64
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import Settings  # noqa: E402
from main import create_app  # noqa: E402
from models import ResponseMode  # noqa: E402
from services.vision_service import (  # noqa: E402
    VisionService,
    VisionServiceError,
    parse_model_output,
)

# 1x1 PNG
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def client(**kw):
    s = Settings(demo_mode=kw.pop("demo_mode", True), **kw)
    return TestClient(create_app(s))


def post(c, image=PNG, name="a.png", ctype="image/png", question="What is ahead of me?", mode="concise"):
    files = {"image": (name, image, ctype)} if image is not None else None
    return c.post("/api/analyze", files=files, data={"question": question, "response_mode": mode})


def test_health():
    r = client().get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok" and r.json()["demo_mode"] is True


def test_demo_mode_no_api_key():
    r = post(client())
    assert r.status_code == 200
    body = r.json()
    assert body["demo_mode"] is True
    assert "doorway" in body["answer"].lower()
    assert body["uncertainty"] and body["safety_note"]


def test_detailed_longer_than_concise():
    c = client()
    short = post(c, mode="concise").json()["answer"]
    long_ = post(c, mode="detailed").json()["answer"]
    assert len(long_) > len(short)


def test_missing_image():
    assert post(client(), image=None).status_code == 400


def test_empty_question():
    assert post(client(), question="   ").status_code == 400


def test_question_too_long():
    assert post(client(), question="x" * 501).status_code == 400


def test_wrong_content_type():
    assert post(client(), image=b"hello", name="a.txt", ctype="text/plain").status_code == 415


def test_fake_image_bytes():
    assert post(client(), image=b"not really a png").status_code == 415


def test_image_too_large():
    c = client(max_image_bytes=len(PNG) - 1)
    assert post(c).status_code == 413


def test_not_configured_without_key():
    r = post(client(demo_mode=False, model_api_key=""))
    assert r.status_code == 503


def test_malformed_model_response():
    for bad in ["", "not json", "{}", '{"answer": "x"}', "```json\n{oops}\n```"]:
        with pytest.raises(VisionServiceError):
            parse_model_output(bad)


def test_valid_model_response_with_fences():
    text = '```json\n{"answer":"A door.","observations":[{"object":"door","relative_position":"ahead","confidence":0.7}],"uncertainty":"Unclear.","safety_note":"Verify."}\n```'
    assert parse_model_output(text).answer == "A door."


def test_malformed_provider_output_returns_502(monkeypatch):
    async def fake(self, *a, **k):
        return "garbage"

    monkeypatch.setattr(VisionService, "_call_provider", fake)
    c = client(demo_mode=False, model_api_key="k")
    r = post(c)
    assert r.status_code == 502


def test_provider_success_path(monkeypatch):
    async def fake(self, *a, **k):
        return '{"answer":"A hallway.","observations":[],"uncertainty":"Limited view.","safety_note":"Verify."}'

    monkeypatch.setattr(VisionService, "_call_provider", fake)
    c = client(demo_mode=False, model_api_key="k")
    r = post(c)
    assert r.status_code == 200 and r.json()["answer"] == "A hallway."
