from __future__ import annotations

from functools import cache

from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str = "secret-key-change-in-production"
    FRONTEND_URL: str = 'http://localhost:8080'

    model_config = SettingsConfigDict(
        env_file='.env', env_file_encoding='utf-8',
    )


@cache
def get_settings() -> Settings:
    return Settings()
