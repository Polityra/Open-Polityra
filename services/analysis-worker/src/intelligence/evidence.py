"""Deterministic candidate matching for later human or model review."""

from __future__ import annotations

import re
from typing import Literal

from src.intelligence.schemas import (
    EvidenceMatch,
    EvidenceMatchRequest,
    EvidenceMatchResponse,
)

_TOKENS = re.compile(r"[A-Za-z0-9']{3,}")
_NUMBER = re.compile(r"\b\d+(?:[.,]\d+)?\b")
_NEGATION = {"no", "not", "never", "denied", "false", "didn't", "without"}


def tokens(text: str) -> set[str]:
    return {token.lower() for token in _TOKENS.findall(text)}


def overlap(left: str, right: str) -> float:
    left_tokens = tokens(left)
    right_tokens = tokens(right)
    union = left_tokens | right_tokens
    return len(left_tokens & right_tokens) / len(union) if union else 0.0


def match_evidence(request: EvidenceMatchRequest) -> EvidenceMatchResponse:
    matches: list[EvidenceMatch] = []
    claim_numbers = set(_NUMBER.findall(request.claim_text))
    claim_negated = bool(tokens(request.claim_text) & _NEGATION)
    for candidate in request.candidates:
        score = overlap(request.claim_text, candidate.text)
        if score < 0.1:
            continue
        candidate_numbers = set(_NUMBER.findall(candidate.text))
        candidate_negated = bool(tokens(candidate.text) & _NEGATION)
        if (
            claim_numbers
            and candidate_numbers
            and claim_numbers.isdisjoint(candidate_numbers)
            or claim_negated != candidate_negated
        ):
            stance: Literal["contradicts", "supports", "context"] = "contradicts"
        elif score >= 0.25:
            stance = "supports"
        else:
            stance = "context"
        start = 0
        end = min(len(candidate.text), max(1, len(candidate.text)))
        matches.append(
            EvidenceMatch(
                document_id=candidate.document_id,
                source_id=candidate.source_id,
                dependency_root=candidate.dependency_root,
                stance=stance,
                quote=candidate.text[start:end],
                source_start=start,
                source_end=end,
                relevance=round(score, 3),
            )
        )
    return EvidenceMatchResponse(
        claim_id=request.claim_id,
        matches=sorted(matches, key=lambda item: item.relevance, reverse=True)[:25],
    )
