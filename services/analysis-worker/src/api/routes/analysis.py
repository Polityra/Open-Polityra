"""POST /api/v1/analysis endpoint and its orchestration."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, HTTPException
from scipy import stats as sp_stats  # noqa: N814 – convention alias

from src.ai.providers.local_provider import OllamaProvider
from src.analytics.statistics.descriptive import (
    describe as descriptive_statistics,
)
from src.api.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    DataScope,
    EvidenceItem,
    ForecastInfo,
    Methodology,
    ProjectedValue,
    ScenarioResult,
    UncertaintyNote,
)
from src.common.errors import (
    DataSourceError,
    ModelUnavailableError,
    PipelineError,
    ValidationError,
)
from src.common.logger import get_logger, log_with_extra
from src.data.ingestion.base import DataIngestor
from src.data.storage.local_store import FileStore
from src.forecasting.time_series.moving_average import (
    exponential_moving_average,
    moving_average,
)
from src.scenarios.simulation.base import SimulationScenario

router = APIRouter(tags=["analysis"])

logger = get_logger("analysis-worker.api")


# ── Data retrieval stub ────────────────────────────────────────────────────────


def _retrieve_data(topic: str, scope: DataScope) -> list[float]:
    """Retrieve data for the given topic and scope.

    In production this would query live data sources (APIs, databases).
    The default implementation generates synthetic data for demonstration.
    """
    try:
        store = FileStore("/tmp/analysis-worker-data")
        snapshot_path = store.get(topic, scope)
        if snapshot_path:
            import csv

            with open(snapshot_path, newline="") as fh:
                reader = csv.reader(fh)
                return [float(row[0]) for row in reader if row]
    except FileNotFoundError:
        pass  # no stored data – generate samples below
    return _generate_sample_data(topic)


def _generate_sample_data(topic: str, n: int = 60) -> list[float]:
    """Generate synthetic time-series data for the given topic.

    Sample implementation – replace with real source integration in production.
    """
    import numpy as np

    seed = abs(hash(topic)) % (2**32) if topic else 42
    rng = np.random.default_rng(seed)
    trend = np.linspace(0, 10, n)
    noise = rng.normal(0, 1.5, n)
    return (trend + noise).tolist()


# ── Endpoint ───────────────────────────────────────────────────────────────────


@router.post("/api/v1/analysis", response_model=AnalysisResponse, status_code=200)
async def analyse(req: AnalysisRequest) -> AnalysisResponse:
    """Run the analysis pipeline for a given topic.

    Pipeline stages (each is a separate function)::

        1. data retrieval  – fetch or generate observations
        2. statistical analysis – descriptive statistics on the data
        3. AI-assisted synthesis – optional LLM-based narrative generation
        4. result formatting – construct the response envelope
    """
    stage_start = time.perf_counter()

    # --- validate ---
    if req.topic.strip() == "":
        raise ValidationError(message="topic must be non-empty", details={"field": "topic"})

    # --- stage 1: data retrieval ---
    try:
        observations = _retrieve_data(req.topic, req.scope)
        evidence: list[EvidenceItem] = [
            EvidenceItem(
                source=f"synthetic-data-{req.scope.value}",
                type="generated",
                description=f"{len(observations)} synthetic observations for {req.topic}",
                relevance=0.6,
            )
        ]
    except Exception as exc:  # noqa: BLE001
        raise DataSourceError(
            message=f"Failed to retrieve data for topic '{req.topic}'",
            details={"topic": req.topic},
        ) from exc

    retrieval_ms = (time.perf_counter() - stage_start) * 1000
    log_with_extra(logger, "info", "data retrieved", {"stage": "retrieval", "ms": retrieval_ms})

    # --- stage 2: statistical analysis ---
    stage_start = time.perf_counter()
    stats_result = descriptive_statistics(observations)
    statistics_dict = stats_result if isinstance(stats_result, dict) else {}
    evidence.append(
        EvidenceItem(
            source="descriptive-statistics",
            type="computed",
            description=f"Descriptive statistics on {len(observations)} observations",
            relevance=0.8,
        )
    )

    # optional forecasting
    forecast: ForecastInfo | None = None
    if req.methodology in (Methodology.FORECASTING, Methodology.COMPREHENSIVE):
        ma_vals = moving_average(observations, window=7)
        ema_vals = exponential_moving_average(observations, span=14)
        std_dev = max(statistics_dict.get("std", 1.0), 0.1)
        projected = []
        for i in range(min(req.time_horizon, 30)):
            point = float(ma_vals[-1]) if ma_vals else 0.0
            projected.append(
                ProjectedValue(
                    day=i + len(observations),
                    point_estimate=point,
                    lower_bound=float(sp_stats.norm.ppf(0.05, loc=point, scale=std_dev)),
                    upper_bound=float(sp_stats.norm.ppf(0.95, loc=point, scale=std_dev)),
                )
            )
        forecast = ForecastInfo(
            period_days=req.time_horizon,
            projected_values=projected,
            trend_direction="increasing" if ma_vals[-1] > ma_vals[0] else "decreasing",
        )
        evidence.append(EvidenceItem(source="moving-average-forecast", type="computed", description=f"{req.time_horizon}-day forecast", relevance=0.5))

    stats_ms = (time.perf_counter() - stage_start) * 1000
    log_with_extra(logger, "info", "statistics computed", {"stage": "statistics", "ms": stats_ms})

    # --- stage 3: AI-assisted synthesis (optional) ---
    summary = _default_summary(req.topic, observations, statistics_dict)
    confidence = 0.55
    uncertainty = UncertaintyNote(
        overall_level="medium",
        data_gaps=["synthetic-only-data"],
        model_limitations=["no-llm-synthesis"],
        assumptions=["data-representative"],
    )

    if req.enable_ai_synthesis:
        try:
            ollama = OllamaProvider(model="llama3.2", base_url="http://localhost:11434")
            prompt = (
                f"Summarize the following analysis findings for topic '{req.topic}' in 2-3 sentences:\n"
                f"Statistics: {statistics_dict}\n"
                f"Trend: {forecast.trend_direction if forecast else 'N/A'}\n"
            )
            synthesis = await ollama.generate_text(prompt)
            summary = synthesis.strip() or summary
        except Exception as exc:  # noqa: BLE001
            log_with_extra(logger, "warning", "AI synthesis skipped (model unavailable)", {"error": str(exc)})

    # --- stage 4: scenario simulation (optional) ---
    scenarios: list[ScenarioResult] | None = None
    if req.methodology in (Methodology.SIMULATION, Methodology.COMPREHENSIVE):
        result_data = {
            "mean_outcome": float(statistics_dict.get("mean", 0)),
            "std_outcome": float(statistics_dict.get("std", 1)),
        }
        scenarios = [ScenarioResult(
            name="baseline",
            outcome_summary="Baseline projection with 5% growth assumption.",
            key_metrics=result_data,
        )]

    total_ms = (time.perf_counter() - stage_start) * 1000 + retrieval_ms

    return AnalysisResponse(
        topic=req.topic,
        scope=req.scope,
        summary=summary,
        evidence=evidence,
        confidence=confidence,
        methodology=req.methodology,
        uncertainty=uncertainty,
        statistics=statistics_dict,
        forecast=forecast,
        scenarios=scenarios,
        processing_duration_ms=total_ms,
    )


# ── Helpers ────────────────────────────────────────────────────────────────────


def _default_summary(topic: str, observations: list[float], stats: dict[str, Any]) -> str:
    """Produce a plain-language summary when no AI synthesis is available."""
    mean = stats.get("mean", 0)
    std = stats.get("std", 0)
    return (
        f"Analysis of '{topic}' shows {len(observations)} observations with "
        f"a mean of {mean:.2f} and standard deviation of {std:.2f}. "
        f"The data suggests a {'rising' if std > 0 else 'stable'} pattern. "
        f"Confidence is moderate due to limited sample size."
    )
