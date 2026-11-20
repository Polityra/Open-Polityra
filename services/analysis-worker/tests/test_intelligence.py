from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from src.main import create_app


@pytest.mark.asyncio
async def test_extraction_retains_exact_source_offsets() -> None:
    text = "NATO announced military exercises. The exercises begin next week."
    async with AsyncClient(
        transport=ASGITransport(app=create_app()), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/intelligence/extract",
            json={
                "document_id": str(uuid4()),
                "source_id": str(uuid4()),
                "title": "Exercise announcement",
                "text": text,
                "language": "en",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert (
        body["claims"][0]["text"]
        == text[body["claims"][0]["source_start"] : body["claims"][0]["source_end"]]
    )
    assert body["claims"][0]["claim_type"] == "attributed_statement"
    assert body["entities"][0]["name"] == "NATO"
    assert body["events"][0]["event_type"] == "military_event"


@pytest.mark.asyncio
async def test_repeated_agency_reports_are_not_independent_corroboration() -> None:
    root = uuid4()
    evidence = [
        {
            "id": str(uuid4()),
            "document_id": str(uuid4()),
            "source_id": str(uuid4()),
            "dependency_root": str(root),
            "stance": "supports",
            "quote": "The event occurred.",
            "source_start": 0,
            "source_end": 19,
        },
        {
            "id": str(uuid4()),
            "document_id": str(uuid4()),
            "source_id": str(uuid4()),
            "dependency_root": str(root),
            "stance": "supports",
            "quote": "The agency says the event occurred.",
            "source_start": 0,
            "source_end": 37,
        },
    ]
    async with AsyncClient(
        transport=ASGITransport(app=create_app()), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/intelligence/verify",
            json={"claim_id": str(uuid4()), "evidence": evidence},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "supported"
    assert body["independent_supporting_chains"] == 1


@pytest.mark.asyncio
async def test_support_and_contradiction_remain_disputed() -> None:
    common = {
        "quote": "A reported value.",
        "source_start": 0,
        "source_end": 18,
    }
    async with AsyncClient(
        transport=ASGITransport(app=create_app()), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/intelligence/verify",
            json={
                "claim_id": str(uuid4()),
                "evidence": [
                    {
                        **common,
                        "id": str(uuid4()),
                        "document_id": str(uuid4()),
                        "source_id": str(uuid4()),
                        "stance": "supports",
                    },
                    {
                        **common,
                        "id": str(uuid4()),
                        "document_id": str(uuid4()),
                        "source_id": str(uuid4()),
                        "stance": "contradicts",
                    },
                ],
            },
        )

    assert response.status_code == 200
    assert response.json()["status"] == "disputed"


@pytest.mark.asyncio
async def test_numeric_mismatch_is_preserved_as_contradiction() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/intelligence/match-evidence",
            json={
                "claim_id": str(uuid4()),
                "claim_text": "The report records 120 incidents.",
                "candidates": [
                    {
                        "document_id": str(uuid4()),
                        "source_id": str(uuid4()),
                        "text": "The report records 90 incidents.",
                    }
                ],
            },
        )

    assert response.status_code == 200
    assert response.json()["matches"][0]["stance"] == "contradicts"


@pytest.mark.asyncio
async def test_report_uses_structured_claim_citation() -> None:
    claim_id = uuid4()
    evidence_id = uuid4()
    async with AsyncClient(
        transport=ASGITransport(app=create_app()), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/intelligence/report",
            json={
                "claim_id": str(claim_id),
                "document_id": str(uuid4()),
                "document_title": "Verified report",
                "claim_text": "The organization announced exercises.",
                "status": "corroborated",
                "evidence_ids": [str(evidence_id)],
                "contradictory_evidence_ids": [],
            },
        )

    assert response.status_code == 200
    assert response.json()["citations"][0] == {
        "key": "C1",
        "claim_id": str(claim_id),
        "evidence_ids": [str(evidence_id)],
        "statement_type": "attributed_statement",
    }
