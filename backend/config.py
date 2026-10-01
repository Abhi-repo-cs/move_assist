"""Environment-driven configuration. No secrets are hardcoded."""
import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class Settings:
    demo_mode: bool = field(default_factory=lambda: _bool("DEMO_MODE", True))
    model_api_key: str = field(default_factory=lambda: os.getenv("MODEL_API_KEY", ""))
    model_name: str = field(default_factory=lambda: os.getenv("MODEL_NAME", "gpt-4o-mini"))
    model_base_url: str = field(
        default_factory=lambda: os.getenv("MODEL_BASE_URL", "https://api.openai.com/v1")
    )
    model_timeout: float = field(
        default_factory=lambda: float(os.getenv("MODEL_TIMEOUT_SECONDS", "30"))
    )
    max_image_bytes: int = field(
        default_factory=lambda: int(float(os.getenv("MAX_IMAGE_MB", "8")) * 1024 * 1024)
    )
    max_question_chars: int = field(
        default_factory=lambda: int(os.getenv("MAX_QUESTION_CHARS", "500"))
    )
    cors_origins: list = field(
        default_factory=lambda: [
            o.strip()
            for o in os.getenv(
                "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
            ).split(",")
            if o.strip()
        ]
    )

    @property
    def ai_configured(self) -> bool:
        return bool(self.model_api_key)


def get_settings() -> Settings:
    return Settings()
