"""
RAKTSETU - Application Configuration
Reads settings from environment variables with sensible defaults.
Never hardcode secrets here.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


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

    # Database (future — not required for prototype)
    DATABASE_URL: str = ""
    REDIS_URL: str = ""

    # Map provider (optional — falls back to OSM if not set)
    MAPTILER_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
