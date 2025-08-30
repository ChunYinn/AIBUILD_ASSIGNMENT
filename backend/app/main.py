from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi import status

from app.routers.auth import router as auth_router
from app.routers.upload import router as upload_router

from app.core.cors import add_cors_middleware
from app.db import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title='AIBUILD ASSIGNMENT',
        version='1.0.0', lifespan=lifespan,
    )

    @app.get('/')
    async def root():
        return {'message': 'AIBUILD ASSIGNMENT'}

    # health check endpoint
    @app.get('/health', status_code=status.HTTP_200_OK, tags=['Health'])
    async def health_check():
        return {'status': 'ok'}

    # Include routers
    app.include_router(auth_router)
    app.include_router(upload_router)


    # middleware
    add_cors_middleware(app)
    return app


app = create_app()
