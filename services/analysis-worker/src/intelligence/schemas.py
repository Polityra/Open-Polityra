"""Typed contracts for claim extraction and deterministic verification."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ClaimType(str, Enum):
    FACTUAL_STATEMENT = "factual_statement"
    ATTRIBUTED_STATEMENT = "attributed_statement"
    QUANTITATIVE = "quantitative"
    ANNOUNCEMENT = "announcement"


class Entity(BaseModel):
    name: str
    entity_type: str
    source_start: int = Field(ge=0)
    source_end: int = Field(gt=0)


class ExtractedClaim(BaseModel):
    subject: str | None = None
    predicate: str
    object: str | None = None
    text: str
    claim_type: ClaimType
    source_start: int = Field(ge=0)
    source_end: int = Field(gt=0)
    language: str | None = None
    extraction_model: str = "deterministic-span-v1"
    extraction_confidence: float = Field(default=0.5, ge=0, le=1)


class ExtractedEvent(BaseModel):
    event_type: str
    title: str
    occurred_at: datetime | None = None
    claim_offsets: list[tuple[int, int]]
    source_text: str


class ExtractionRequest(BaseModel):
    document_id: UUID
    source_id: UUID
    title: str = Field(min_length=1, max_length=1000)
    text: str = Field(min_length=1, max_length=2_000_000)
    language: str | None = Field(default=None, max_length=32)
    published_at: datetime | None = None

    @field_validator("text")
    @classmethod
    def reject_empty_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must contain non-whitespace characters")
        return value


class ExtractionResponse(BaseModel):
    document_id: UUID
    claims: list[ExtractedClaim]
    entities: list[Entity]
    events: list[ExtractedEvent]
    model: str = "deterministic-span-v1"
    limitations: list[str] = [
        "Extraction is deterministic and heuristic; every claim retains an exact source span.",
        "Extraction confidence is not a verification score and has not been calibrated.",
    ]


class EvidenceCandidate(BaseModel):
    id: UUID
    document_id: UUID
    source_id: UUID
    dependency_root: UUID | None = None
    stance: Literal["supports", "contradicts", "context"]
    quote: str = Field(min_length=1)
    source_start: int = Field(ge=0)
    source_end: int = Field(gt=0)
    published_at: datetime | None = None


class VerificationRequest(BaseModel):
    claim_id: UUID
    evidence: list[EvidenceCandidate]


class VerificationResponse(BaseModel):
    claim_id: UUID
    status: Literal[
        "unverified",
        "supported",
        "corroborated",
        "contradicted",
        "disputed",
        "insufficient_evidence",
        "under_review",
    ]
    independent_supporting_chains: int
    supporting_evidence_ids: list[UUID]
    contradictory_evidence_ids: list[UUID]
    reasoning: str
    limitations: list[str] = [
        "This deterministic decision only compares explicitly attributed evidence stances.",
        "It does not independently establish factual truth.",
    ]


class EvidenceDocumentCandidate(BaseModel):
    document_id: UUID
    source_id: UUID
    dependency_root: UUID | None = None
    text: str = Field(min_length=1)
    published_at: datetime | None = None


class EvidenceMatchRequest(BaseModel):
    claim_id: UUID
    claim_text: str = Field(min_length=1)
    candidates: list[EvidenceDocumentCandidate] = Field(max_length=250)


class EvidenceMatch(BaseModel):
    document_id: UUID
    source_id: UUID
    dependency_root: UUID | None = None
    stance: Literal["supports", "contradicts", "context"]
    quote: str
    source_start: int = Field(ge=0)
    source_end: int = Field(gt=0)
    relevance: float = Field(ge=0, le=1)
    match_method: str = "deterministic-token-overlap-v1"


class EvidenceMatchResponse(BaseModel):
    claim_id: UUID
    matches: list[EvidenceMatch]
    limitations: list[str] = [
        "Matches are lexical heuristics and must be reviewed before being treated as evidence.",
        "Copied reports are represented by dependency roots and are not counted as independent sources.",
    ]


class AnalysisClaimInput(BaseModel):
    claim_id: UUID
    document_id: UUID
    document_title: str
    claim_text: str
    status: str
    evidence_ids: list[UUID] = Field(max_length=250)
    contradictory_evidence_ids: list[UUID] = Field(max_length=250)


class AnalysisCitation(BaseModel):
    key: str
    claim_id: UUID
    evidence_ids: list[UUID]
    statement_type: Literal[
        "verified_observation",
        "attributed_statement",
        "unverified_claim",
        "analytical_interpretation",
        "forecast",
    ]


class IntelligenceReportResponse(BaseModel):
    title: str
    summary: str
    citations: list[AnalysisCitation]
    uncertainty: list[str]
    limitations: list[str] = [
        "This report deterministically restates linked claims; it does not add new factual claims.",
        "A supported or corroborated status reflects available evidence, not certainty of truth.",
    ]
