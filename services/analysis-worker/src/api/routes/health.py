"""Health and readiness probe endpoints."""

from __future__ import annotations

import time

from fastapi import APIRouter
from src.ai.providers.local_provider import OllamaProvider

router = APIRouter(tags=["health"])


# Module-level bootstrap timestamp.
_startup_time: float | None = None


def set_bootstrap_timestamp(ts: float) -> None:
    """Record the application start time (called from lifespan)."""
    global _startup_time
    _startup_time = ts


def _uptime() -> float:
    if _startup_time is None:
        return 0.0
    return time.time() - _startup_time


@router.get("/api/v1/health", summary="Service health status")
async def health() -> dict:
    """Return a structured JSON object describing the service's health."""

    return {
        "status": "ok",
        "service": "analysis-worker",
        "uptime_seconds": _uptime(),
        "components": {
            "analysis": "ok",
        },
    }


@router.get("/api/v1/health/ready", summary="Readiness probe")
async def health_ready() -> dict:
    """Return whether the service is ready to accept requests.

    Readiness requires the configured local Ollama model to be available.
    """
    provider = OllamaProvider()
    provider_status = await provider.health_check()
    checks: dict[str, bool] = {
        "internal": True,
        "ai_model": bool(provider_status["available"]),
    }

    ready = all(checks.values())

    return {
        "ready": ready,
        "checks": checks,
    }
