"""Conservative extraction that never synthesizes beyond exact source spans."""

from __future__ import annotations

import re
from dataclasses import dataclass

from src.intelligence.schemas import (
    ClaimType,
    Entity,
    ExtractedClaim,
    ExtractedEvent,
    ExtractionRequest,
    ExtractionResponse,
)

_SENTENCE = re.compile(r"[^.!?\n]+(?:[.!?]+(?=\s|$)|$)")
_NUMBER = re.compile(
    r"\b\d+(?:[.,]\d+)?(?:\s?%|\s(?:billion|million|thousand))?\b", re.IGNORECASE
)
_ENTITY = re.compile(
    r"\b(?:NATO|EU|UN|WHO|OECD|SIPRI|UCDP|[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,3})\b"
)
_EVENT_TERMS = {
    "cyber_incident": ("cyber", "breach", "attack", "malware"),
    "military_event": ("military", "troops", "missile", "exercise"),
    "sanction": ("sanction", "sanctions"),
    "election": ("election", "vote", "ballot"),
    "diplomatic_event": ("meeting", "summit", "diplomatic", "talks"),
    "legislation": ("law", "legislation", "parliament", "bill"),
    "economic_event": ("inflation", "gdp", "economy", "trade"),
    "conflict_incident": ("conflict", "casualt", "shelling", "fighting"),
    "public_announcement": ("announc", "said", "stated", "reported"),
}


@dataclass(frozen=True)
class Span:
    start: int
    end: int
    text: str


def sentence_spans(text: str) -> list[Span]:
    spans = []
    for match in _SENTENCE.finditer(text):
        value = match.group(0).strip()
        if not value:
            continue
        start = match.start() + len(match.group(0)) - len(match.group(0).lstrip())
        end = start + len(value)
        spans.append(Span(start, end, value))
    return spans


def _predicate(span: Span) -> str:
    words = span.text.split()
    if len(words) < 2:
        return "states"
    return " ".join(words[1 : min(6, len(words))])


def _claim_type(text: str) -> ClaimType:
    lowered = text.lower()
    if any(word in lowered for word in ("said", "stated", "announced", "reported")):
        return ClaimType.ATTRIBUTED_STATEMENT
    if _NUMBER.search(text):
        return ClaimType.QUANTITATIVE
    return ClaimType.FACTUAL_STATEMENT


def extract_document(request: ExtractionRequest) -> ExtractionResponse:
    spans = sentence_spans(request.text)
    claims = [
        ExtractedClaim(
            subject=span.text.split(maxsplit=1)[0] if " " in span.text else None,
            predicate=_predicate(span),
            object=None,
            text=span.text,
            claim_type=_claim_type(span.text),
            source_start=span.start,
            source_end=span.end,
            language=request.language,
            extraction_confidence=0.45,
        )
        for span in spans
        if len(span.text.split()) >= 3
    ]

    entities: list[Entity] = []
    entity_keys: set[tuple[str, int, int]] = set()
    for match in _ENTITY.finditer(request.text):
        name = match.group(0)
        key = (name.casefold(), match.start(), match.end())
        if key in entity_keys:
            continue
        entity_keys.add(key)
        entities.append(
            Entity(
                name=name,
                entity_type="organization"
                if name in {"NATO", "EU", "UN", "WHO", "OECD", "SIPRI", "UCDP"}
                else "named_entity",
                source_start=match.start(),
                source_end=match.end(),
            )
        )

    events: list[ExtractedEvent] = []
    for span in spans:
        lowered = span.text.lower()
        matches = [
            event_type
            for event_type, terms in _EVENT_TERMS.items()
            if any(term in lowered for term in terms)
        ]
        for event_type in matches[:1]:
            events.append(
                ExtractedEvent(
                    event_type=event_type,
                    title=span.text[:200],
                    occurred_at=request.published_at,
                    claim_offsets=[(span.start, span.end)],
                    source_text=span.text,
                )
            )

    return ExtractionResponse(
        document_id=request.document_id,
        claims=claims,
        entities=entities,
        events=events,
    )
