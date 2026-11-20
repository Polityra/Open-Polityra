"""Verification state decisions from explicitly linked evidence."""

from __future__ import annotations

from collections import defaultdict
from typing import Literal
from uuid import UUID

from src.intelligence.schemas import (
    EvidenceCandidate,
    VerificationRequest,
    VerificationResponse,
)


def evidence_chain(candidate: EvidenceCandidate) -> UUID:
    return candidate.dependency_root or candidate.source_id


def verify_claim(request: VerificationRequest) -> VerificationResponse:
    grouped: dict[object, list[EvidenceCandidate]] = defaultdict(list)
    for evidence in request.evidence:
        grouped[evidence.stance].append(evidence)

    supporting = grouped["supports"]
    contradicting = grouped["contradicts"]
    support_chains = {evidence_chain(item) for item in supporting}

    if supporting and contradicting:
        status: Literal[
            "disputed",
            "contradicted",
            "corroborated",
            "supported",
            "insufficient_evidence",
        ] = "disputed"
        reasoning = "Supporting and contradictory evidence are both present; disagreement is preserved."
    elif contradicting:
        status = "contradicted"
        reasoning = (
            "Contradictory evidence is present and no supporting evidence is linked."
        )
    elif len(support_chains) >= 2:
        status = "corroborated"
        reasoning = "Evidence supports the claim through at least two distinct dependency chains."
    elif supporting:
        status = "supported"
        reasoning = "Evidence supports the claim through one dependency chain."
    elif request.evidence:
        status = "insufficient_evidence"
        reasoning = "Linked evidence contains no explicit support or contradiction."
    else:
        status = "insufficient_evidence"
        reasoning = "No evidence has been linked to the claim."

    return VerificationResponse(
        claim_id=request.claim_id,
        status=status,
        independent_supporting_chains=len(support_chains),
        supporting_evidence_ids=[item.id for item in supporting],
        contradictory_evidence_ids=[item.id for item in contradicting],
        reasoning=reasoning,
    )
