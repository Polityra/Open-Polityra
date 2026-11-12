import pytest
from httpx import ASGITransport, AsyncClient
from src.ai.providers.local_provider import OllamaProvider
from src.main import create_app


@pytest.mark.asyncio
async def test_health_route_reports_service_identity() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["service"] == "analysis-worker"


@pytest.mark.asyncio
async def test_readiness_route_checks_the_configured_local_model(monkeypatch) -> None:
    async def unavailable_model(self: OllamaProvider) -> dict[str, object]:
        return {"available": False, "model": self.model_name}

    monkeypatch.setattr(OllamaProvider, "health_check", unavailable_model)
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {
        "ready": False,
        "checks": {"internal": True, "ai_model": False},
    }


@pytest.mark.asyncio
async def test_analysis_requires_database_context_or_observations() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/v1/analysis",
            json={"topic": "economic outlook", "enable_ai_synthesis": False},
        )

    assert response.status_code == 400
    assert "database context" in response.json()["message"]


@pytest.mark.asyncio
async def test_analysis_uses_supplied_context_without_inventing_observations() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/v1/analysis",
            json={
                "topic": "economic outlook",
                "context": "Stored indicator: unemployment rate",
                "enable_ai_synthesis": False,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["statistics"] is None
    assert body["forecast"] is None
    assert body["evidence"][0]["source"] == "database-context"
    assert "synthetic" not in body["summary"].lower()


def test_worker_uses_the_configured_model(monkeypatch) -> None:
    monkeypatch.setenv("OLLAMA_MODEL", "olmo-3:7b")

    assert OllamaProvider().model_name == "olmo-3:7b"


@pytest.mark.asyncio
async def test_constant_observations_produce_json_safe_statistics() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.post(
            "/api/v1/analysis",
            json={
                "topic": "stable series",
                "observations": [5] * 10,
                "enable_ai_synthesis": False,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["statistics"]["skewness"] is None
    assert body["statistics"]["kurtosis"] is None
    assert body["forecast"]["trend_direction"] == "stable"
    assert body["forecast"]["projected_values"][0]["day"] == 1
    assert body["forecast"]["projected_values"][0]["lower_bound"] == 5
    assert "confidence-is-not-calibrated" in body["uncertainty"]["model_limitations"]
