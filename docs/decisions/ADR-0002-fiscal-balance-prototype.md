# ADR-0002: Finland fiscal balance prototype

- **Status:** Project-owner-approved prototype scope; independent maintainer and domain review
  pending
- **Date:** 2026-11-04

## Context

The roadmap calls for a narrow public-data research question with traceable sources and transparent
calculations. This project has not yet verified the availability of an economics/statistics
reviewer. A useful first vertical slice should remain reproducible without a model provider or
database.

## Decision

Use Finland's annual general-government net lending/borrowing (`B9`) and consolidated gross debt
(`GD`) as a descriptive prototype, sourced from Eurostat dataset `gov_10dd_edpt1`. Check in a dated
source snapshot and offer a deterministic baseline, configurable stress case, and
gradual-improvement scenario through the API and economy dashboard.

Label all calculated paths illustrative rather than forecasts. Keep the transformation, assumptions,
source, retrieval date, and limitations visible. Do not generate factual claims with an LLM in this
prototype.

## Consequences

- The data endpoint is independently usable from the existing database-backed indicator registry.
- The API validates scenario bounds and returns source metadata with observed and projected values.
- The simplified debt-ratio formula is easy to reproduce but omits important national-accounting
  effects and does not quantify uncertainty.
- A domain reviewer must assess definitions, source revisions, and the model before this can be
  represented as research-validated.
- The repository cannot itself establish maintainer availability, organisation permissions, or
  external review.
