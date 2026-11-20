"""Evidence-preserving deterministic intelligence reporting."""

from __future__ import annotations

from typing import Literal

from src.intelligence.schemas import (
    AnalysisCitation,
    AnalysisClaimInput,
    IntelligenceReportResponse,
)


def build_report(item: AnalysisClaimInput) -> IntelligenceReportResponse:
    if item.status in {"supported", "corroborated"}:
        prefix = "Evidence-linked attributed statement"
        statement_type: Literal["attributed_statement", "unverified_claim"] = (
            "attributed_statement"
        )
    elif item.status == "contradicted":
        prefix = "Contradicted claim"
        statement_type = "unverified_claim"
    else:
        prefix = "Unresolved claim"
        statement_type = "unverified_claim"
    if item.contradictory_evidence_ids and item.evidence_ids:
        uncertainty = [
            "Supporting and contradictory evidence are both linked; disagreement remains unresolved."
        ]
    elif item.status == "insufficient_evidence":
        uncertainty = ["No explicit supporting or contradictory evidence is available."]
    else:
        uncertainty = ["Evidence quality and source independence require human review."]
    return IntelligenceReportResponse(
        title=item.document_title[:200],
        summary=f"{prefix}: {item.claim_text} [C1]",
        citations=[
            AnalysisCitation(
                key="C1",
                claim_id=item.claim_id,
                evidence_ids=item.evidence_ids + item.contradictory_evidence_ids,
                statement_type=statement_type,
            )
        ],
        uncertainty=uncertainty,
    )
