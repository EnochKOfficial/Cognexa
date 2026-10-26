"""Core configuration for the Cognexa backend.

All values can be overridden through environment variables or a `.env` file
(see `.env.example`). Gemma 4 runs through Google AI Studio (`google-genai`)
with the model id `gemma-4-31b-it`; the API key stays on the backend only.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment / `.env`."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Gemma 4 via Google AI Studio ---
    ai_provider: str = "mock"  # "gemma4" (Gemma 4 via Google AI Studio) or "mock"
    google_api_key: str = ""  # GOOGLE_API_KEY — backend only, never exposed
    gemma_model: str = "gemma-4-31b-it"  # exact Google AI Studio model id
    ai_timeout_seconds: float = 180.0  # image analysis can take 40-120s

    # --- Upload validation ---
    max_upload_mb: int = 10
    allowed_content_types: set[str] = {
        "image/png",
        "image/jpeg",
        "image/jpg",
    }
    allowed_formats: set[str] = {"PNG", "JPEG"}

    # --- Storage / CORS ---
    upload_dir: str = "uploads"
    # Explicit allow-list: local development + the deployed Vercel frontend.
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,https://cognexa-psi.vercel.app"
    )

    # --- Demo polish ---
    mock_processing_delay: float = 0.4

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def ai_configured(self) -> bool:
        """True only when the Gemma 4 provider is selected AND a key is present."""
        return self.ai_provider != "mock" and bool(self.google_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
