from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Server configuration loaded exclusively from environment variables."""

    app_env: str = "development"
    api_prefix: str = "/api/v1"
    frontend_origins: list[str] | str = ["http://localhost:3000"]

    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_evidence_bucket: str = "civic-evidence"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.8-flash"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
