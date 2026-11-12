"""FastAPI application entry-point for the analysis worker."""

from __future__ import annotations

import signal
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.routes import analysis, health
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

    # Signal handler for graceful shutdown
    _signal_stop: signal.Signals | None = None

    def _handle_signal(signum: int, frame):  # type: ignore[type-arg]
        nonlocal _signal_stop
        _signal_stop = signum

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

    # CORS – allow any origin in development; restrict in production via env-var
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # TODO: tighten for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(analysis.router)

    return app


app = create_app()


# ── CLI entry-point ────────────────────────────────────────────────────────────


def main():
    """Run the service via ``uv`` script:: $ poetry run dev."""
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":  # pragma: no cover
    main()
