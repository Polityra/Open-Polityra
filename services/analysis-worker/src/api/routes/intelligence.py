"""Typed claim extraction and evidence-verification endpoints."""

from __future__ import annotations

import hmac
import os

from fastapi import APIRouter, Header, HTTPException
from src.intelligence.evidence import match_evidence
from src.intelligence.extraction import extract_document
from src.intelligence.reporting import build_report
from src.intelligence.schemas import (
    AnalysisClaimInput,
    EvidenceMatchRequest,
    EvidenceMatchResponse,
    ExtractionRequest,
    ExtractionResponse,
    IntelligenceReportResponse,
    VerificationRequest,
    VerificationResponse,
)
from src.intelligence.verification import verify_claim

router = APIRouter(prefix="/api/v1/intelligence", tags=["intelligence"])


def require_internal_token(authorization: str | None) -> None:
    expected = os.getenv("INTERNAL_SERVICE_TOKEN")
    if not expected:
        if (
            os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development"))
            == "production"
        ):
            raise HTTPException(
                status_code=503,
                detail="Internal service authentication is not configured",
            )
        return
    if len(expected) < 32:
        raise HTTPException(
            status_code=503,
            detail="Internal service token must be at least 32 characters",
        )
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if len(supplied) != len(expected) or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid internal service token")


@router.post("/extract", response_model=ExtractionResponse)
async def extract(
    request: ExtractionRequest,
    authorization: str | None = Header(default=None),
) -> ExtractionResponse:
    require_internal_token(authorization)
    return extract_document(request)


@router.post("/verify", response_model=VerificationResponse)
async def verify(
    request: VerificationRequest,
    authorization: str | None = Header(default=None),
) -> VerificationResponse:
    require_internal_token(authorization)
    return verify_claim(request)


@router.post("/match-evidence", response_model=EvidenceMatchResponse)
async def find_evidence(
    request: EvidenceMatchRequest,
    authorization: str | None = Header(default=None),
) -> EvidenceMatchResponse:
    require_internal_token(authorization)
    return match_evidence(request)


@router.post("/report", response_model=IntelligenceReportResponse)
async def report(
    request: AnalysisClaimInput,
    authorization: str | None = Header(default=None),
) -> IntelligenceReportResponse:
    require_internal_token(authorization)
    return build_report(request)
