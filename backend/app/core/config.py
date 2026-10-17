"""
RAKTSETU - Application Configuration
Reads settings from environment variables with sensible defaults.
Never hardcode secrets here.
"""

import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "RAKTSETU"
    ENVIRONMENT: str = "demo"
    DEBUG: bool = True

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Database
    # Default to local SQLite database for portable local development and testing.
    # Set to PostgreSQL connection string in production (e.g. postgresql+psycopg://user:pass@host/dbname).
    DATABASE_URL: str = "sqlite:///./raktsetu.db"
    DATABASE_ECHO: bool = False
    REDIS_URL: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Security & Authentication
    SECRET_KEY: str = "raktsetu-super-secure-production-ready-secret-key-change-in-env-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    AUTH_STRICT: bool = False  # Set to True to require tokens on every protected endpoint; False allows dev/test fallback

    # Notification Boundary & Providers (Milestone 7)
    NOTIFICATION_PROVIDER: str = "mock"  # "mock" | "twilio" | "whatsapp"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    TWILIO_MESSAGING_SERVICE_SID: str = ""
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WEBHOOK_SECRET: str = "raktsetu-webhook-secret-token"
    DEMO_MODE: bool = True  # Strict safeguard: never send live SMS to synthetic/seed donors

    # Map provider (optional — falls back to OpenStreetMap if not set)
    MAPTILER_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def validate_production_configuration(self) -> None:
        """
        Enforces strict production safeguards:
        1. If ENVIRONMENT is 'production' or 'prod':
           - AUTH_STRICT must be True.
           - SECRET_KEY must not be the default placeholder and must be at least 32 characters.
           - DATABASE_URL must not be SQLite (must use PostgreSQL).
           - ALLOWED_ORIGINS must not contain localhost or wildcards.
        """
        if self.ENVIRONMENT.lower() in ["production", "prod"]:
            errors = []
            if not self.AUTH_STRICT:
                errors.append("AUTH_STRICT must be True in production.")
            if "change-in-env" in self.SECRET_KEY or len(self.SECRET_KEY) < 32:
                errors.append("SECRET_KEY is insecure or using default placeholder. A strong, unique secret is required.")
            if self.DATABASE_URL.startswith("sqlite"):
                errors.append("DATABASE_URL cannot be SQLite in production. A PostgreSQL 16 connection is required.")
            if any("localhost" in origin or "*" in origin for origin in self.ALLOWED_ORIGINS):
                errors.append("ALLOWED_ORIGINS cannot contain localhost or wildcards in production.")
            if errors:
                raise RuntimeError("Production security validation failed:\n - " + "\n - ".join(errors))


settings = Settings()

