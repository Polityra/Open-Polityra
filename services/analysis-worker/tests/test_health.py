from fastapi.testclient import TestClient

from src.main import create_app


def test_health_route_reports_service_identity() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["service"] == "analysis-worker"


def test_readiness_route_does_not_claim_placeholder_dependencies_are_ready() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json()["ready"] is False
    assert response.json()["checks"]["storage"] is False
