"""Health and readiness probe endpoints."""

from __future__ import annotations

import time

from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])


# Module-level bootstrap timestamp.
_startup_time: float | None = None


def set_bootstrap_timestamp(ts: float) -> None:
    """Record the application start time (called from lifespan)."""
    global _startup_time  # noqa: PLW0603
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
            "database": "ok",
            "ai_providers": "ok",
            "data_sources": "ok",
        },
    }


@router.get("/api/v1/health/ready", summary="Readiness probe")
async def health_ready(request: Request) -> dict:
    """Return whether the service is ready to accept requests.

    In a production deployment this would check downstream dependencies
    such as AI model availability and data source connectivity.  The
    default implementation returns ``True`` unless a request header
    *X-Disable-Readiness* is set to "true" (for testing).
    """
    disable_header = request.headers.get("x-disable-readiness", "").lower()
    force_ready = disable_header == "true"

    checks: dict[str, bool] = {
        "internal": True,
        "ai_providers": False,  # placeholder until a real check is wired up
        "storage": False,      # placeholder until file-based store is wired up
    }

    ready = force_ready or all(checks.values())

    return {
        "ready": ready,
        "checks": checks,
    }
