# Economic Analysis Summary — Prompt Template

## Purpose

Generate structured economic analysis summaries for published indicators.

## Input Parameters

- `indicator_name`: string — the economic indicator being analyzed
- `data_points`: array — historical values with timestamps
- `context_metadata`: object — region, period, source attribution

## Output Requirements

All outputs must include:

1. Summary (max 200 words)
2. Key trends identified with directional labels (increasing/decreasing/stable)
3. Confidence level (High/Moderate/Low)
4. Source citations with URLs
5. Uncertainty notes where data quality is below threshold

## Rules

- Never present AI interpretation as fact — label all interpretations clearly
- Distinguish between observed trends and projected extrapolations
- State confidence levels explicitly for each claim
- If no statistically significant trend exists, state this rather than fabricating patterns
- Reference the original data sources with their update dates
