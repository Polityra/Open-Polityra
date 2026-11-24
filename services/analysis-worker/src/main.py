"""FastAPI application entry-point for the analysis worker."""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager

import uvicorn # pyright: ignore[reportMissingImports]
from fastapi import FastAPI, Request # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from fastapi.responses import JSONResponse # pyright: ignore[reportMissingImports]

from src.api.routes import analysis, health, intelligence
from src.common.errors import AnalysisError
from src.common.logger import get_logger

logger = get_logger("analysis-worker")


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle events."""
    # startup
    logger.info("analysis-worker starting up")
    health.set_bootstrap_timestamp(time.time())

    loop_start = time.perf_counter()
    yield
    # shutdown
    logger.info(
        "analysis-worker shutting down (duration=%.1fs)",
        time.perf_counter() - loop_start,
    )


# ── Application factory ────────────────────────────────────────────────────────


def create_app() -> FastAPI:
    """Construct and configure the FastAPI application.

    Returns an app with CORS middleware, registered routers, and the
    lifespan context manager wired up.
    """
    app = FastAPI(
        title="Open Polityra Analysis Worker",
        version="0.1.0",
        description="Analysis engine for political domain data",
        lifespan=lifespan,
    )

    @app.exception_handler(AnalysisError)
    async def handle_analysis_error(
        _request: Request, error: AnalysisError
    ) -> JSONResponse:
        return JSONResponse(status_code=error.code, content=error.to_dict())

    allowed_origins = [
        origin.strip()
        for origin in os.getenv(
            "ANALYSIS_ALLOWED_ORIGINS", "http://localhost:4000"
        ).split(",")
        if origin.strip()
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["authorization", "content-type"],
    )

    app.include_router(health.router)
    app.include_router(analysis.router)
    app.include_router(intelligence.router)

    return app


app = create_app()


# ── CLI entry-point ────────────────────────────────────────────────────────────


def main():
    """Run the service via ``uv`` script:: $ poetry run dev."""
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("NODE_ENV", os.getenv("ENVIRONMENT", "development"))
        == "development",
        log_level="info",
    )


if __name__ == "__main__":  # pragma: no cover
    main()
