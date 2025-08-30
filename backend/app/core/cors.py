from __future__ import annotations

from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings


def add_cors_middleware(app):
    settings = get_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
