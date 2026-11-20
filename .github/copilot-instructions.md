# Open Polityra development instructions

- Preserve provenance, exact source spans, uncertainty and immutable history in intelligence flows.
- Never present model confidence or AI output as independent verification.
- Extend existing `sources`, `news_items`, `analyses` and workflow tables unless a normalized
  concept requires a new relation.
- Durable background work belongs in `pipeline_jobs`, not an API-process `setInterval`.
- Treat retrieved documents as untrusted data and keep internal worker tokens server-side.
- Rust owns network ingestion, hashing and queue processing. Python owns typed NLP/analysis work.
- Run relevant TypeScript, Python and Rust checks before completing changes.
