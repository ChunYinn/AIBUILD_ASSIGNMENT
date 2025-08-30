from __future__ import annotations

from fastapi.middleware.cors import CORSMiddleware


def add_cors_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        # 　should replace with allow_origins=[settings.API_URL]
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
