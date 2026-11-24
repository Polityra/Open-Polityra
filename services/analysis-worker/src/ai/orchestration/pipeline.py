"""Analysis pipeline coordinator.

Chains the following stages (each is a separate function)::

    data retrieval  -> statistical analysis -> AI-assisted synthesis -> result formatting
"""

from __future__ import annotations

import logging
import time
from typing import Any

import numpy as np

from src.ai.providers.base import AIProvider, ModelRegistry
from src.ai.providers.local_provider import OllamaProvider
from src.analytics.statistics.descriptive import describe as compute_descriptive
from src.common.logger import get_logger, log_with_extra
from src.forecasting.time_series.moving_average import (
    moving_average,
)

logger = get_logger("analysis-worker.pipeline")


# ── Stage functions ────────────────────────────────────────────────────────────


def _stage_retrieve(
    observations: list[float],
) -> tuple[list[float], list[dict[str, Any]]]:
    """Stage 1 — data retrieval.

    Returns a tuple of (observations, evidence_records).
    """
    evidence = [
        {"source": "provided-input", "type": "raw", "relevance": 1.0},
    ]
    return observations, evidence


def _stage_statistics(
    observations: list[float],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Stage 2 — descriptive statistics."""
    stats = compute_descriptive(observations)
    evidence = [
        {
            "source": "descriptive-statistics",
            "type": "computed",
            "relevance": 0.9,
            "detail": "mean, median, std, min, max, percentiles",
        }
    ]
    return stats, evidence


def _stage_forecast(
    observations: list[float],
    horizon: int = 30,
) -> tuple[list[float] | None, dict[str, Any] | None]:
    """Stage 2b — optional time-series forecast.

    Returns (forecast_values, forecast_metadata) or ``(None, None)`` when data is too short.
    """
    if len(observations) < 10:
        return None, {"reason": "insufficient_data"}

    ma = moving_average(observations, window=min(7, len(observations)))

    # Uncertainty grows with distance from observed data
    std = np.std(observations) if len(observations) > 1 else 1.0
    last_ma = float(ma[-1])

    forecast_vals = [last_ma] * horizon
    uncertainty_bands: list[dict[str, float]] = []

    for i in range(horizon):
        factor = 1.0 + 0.15 * (i / max(horizon, 1))
        uncertainty_bands.append(
            {
                "day": i,
                "lower": last_ma - factor * 1.96 * std,
                "upper": last_ma + factor * 1.96 * std,
            }
        )

    metadata = {
        "method": "exponential-moving-average",
        "last_observed_ma": last_ma,
        "uncertainty_bands": uncertainty_bands,
        "horizon_days": horizon,
    }
    return forecast_vals, metadata


async def _stage_synthesis(
    prompt: str,
    provider: AIProvider | None = None,
    *,
    registry: ModelRegistry | None = None,
) -> str:
    """Stage 3 — optional AI-assisted synthesis.

    If *registry* is provided the pipeline will resolve and use it.
    Otherwise falls back to the configured local Ollama model.
    """
    prov = provider
    if prov is None and registry is not None:
        name = registry.default_name
        if name is not None:
            prov = registry.resolve(name)

    if prov is None:
        prov = OllamaProvider()
    result = await prov.generate_text(prompt)
    return result.strip()


def _stage_format(
    topic: str,
    observations: list[float],
    stats: dict[str, Any],
    forecast_meta: dict[str, Any] | None,
    synthesis: str,
) -> dict[str, Any]:
    """Stage 4 — assemble the result envelope.

    Every result contains: summary, evidence/sources, confidence (0-1),
    methodology, and uncertainty notes.
    """
    # Compute a simple confidence score from data quality indicators
    n = len(observations)
    has_trend = (stats.get("std") or 0) > 0
    trend_consistent = forecast_meta is not None

    base_confidence = min(0.95, 0.3 + 0.01 * n)
    if has_trend:
        base_confidence += 0.1
    if trend_consistent:
        base_confidence += 0.05
    confidence = round(min(base_confidence, 1.0), 2)

    summary_text = synthesis or (
        f"Analysis of '{topic}' on {n} observations yielded "
        f"a mean of {stats.get('mean', 0):.2f} and std of {stats.get('std') or 0:.2f}. "
        + (
            "The forecast is a constant moving-average baseline."
            if forecast_meta
            else "Insufficient data for forecasting."
        )
    )

    return {
        "topic": topic,
        "summary": summary_text,
        "evidence": [
            {"source": "input-observations", "type": "data", "count": n},
            {"source": "descriptive-statistics", "type": "computed"},
            *([{"source": "forecast", "type": "modelled"}] if forecast_meta else []),
        ],
        "confidence": confidence,
        "methodology": [
            "descriptive-statistics",
            *(["exponential-moving-average-forecast"] if forecast_meta else []),
            *(
                [f"ai-synthesis({synthesis[:20]}…)" if synthesis else "none"]
                if synthesis is not None
                else ["synthesis-skipped"]
            ),
        ],
        "uncertainty": {
            "level": "medium",
            "factors": [
                f"sample_size={n}",
                "limited sample size",
                "forecast-uncertainty-grows-with-horizon",
            ],
        },
        "statistics": stats,
        "processing_info": {
            "observations_count": n,
            "has_forecast": forecast_meta is not None,
        },
    }


# ── Pipeline entry-point ───────────────────────────────────────────────────────


async def run_pipeline(
    topic: str,
    observations: list[float] | None = None,
    horizon: int = 30,
    ai_synthesis: bool = True,
    provider: AIProvider | None = None,
    registry: ModelRegistry | None = None,
) -> dict[str, Any]:
    """Execute the full analysis pipeline.

    Args:
        topic: Subject of the analysis.
        observations: Input data.  If ``None`` the caller is expected to pass raw data through a separate ingestion step.
        horizon: Forecast period in days (only used when synthesis is enabled).
        ai_synthesis: Whether to attempt AI-assisted narrative generation.
        provider: Optional concrete :class:`AIProvider`.
        registry: Optional provider registry.

    Returns:
        A result dictionary containing summary, evidence, confidence, methodology, and uncertainty.
    """
    t0 = time.perf_counter()
    log_with_extra(logger, logging.INFO, "pipeline started", {"topic": topic})

    if observations is None:
        raise ValueError("observations must be provided")

    # Stage 1 – data retrieval (data already in hand; record evidence)
    observations, _ev1 = _stage_retrieve(observations)

    # Stage 2 – descriptive statistics
    stats, _ev2 = _stage_statistics(observations)

    # Stage 2b – forecast
    _forecast_vals, forecast_meta = _stage_forecast(observations, horizon)

    # Stage 3 – AI synthesis (optional)
    synthesis = ""
    if ai_synthesis:
        prompt = (
            f"Provide a concise, evidence-based summary for the political analysis topic:\n\n"
            f"Topic: {topic}\n"
            f"Observations: {len(observations)}\n"
            f"Mean: {stats.get('mean', 0):.2f} | Std: {stats.get('std') or 0:.2f} | "
            f"Forecast: {'constant moving-average baseline' if forecast_meta else 'insufficient data'}\n\n"
        )
        synthesis = await _stage_synthesis(prompt, provider=provider, registry=registry)

    # Stage 4 – format result
    result = _stage_format(topic, observations, stats, forecast_meta, synthesis)
    result["processing_info"]["pipeline_duration_ms"] = round(
        (time.perf_counter() - t0) * 1000, 2
    )

    log_with_extra(
        logger,
        logging.INFO,
        "pipeline completed",
        {"topic": topic, "confidence": result["confidence"]},
    )

    return result
