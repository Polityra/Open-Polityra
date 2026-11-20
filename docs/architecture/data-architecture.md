# Data Architecture — Open Polityra Platform

## Database Design

The platform uses PostgreSQL as its primary data store. Schema is managed through versioned
migrations in `packages/database/migrations/`.

### Core Tables

| Table         | Purpose                            | Key Fields                                                              |
| ------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| users         | User accounts and roles            | email, role (admin/editor/analyst/viewer), password_hash                |
| sessions      | Authentication sessions            | user_id FK, token_hash, expires_at                                      |
| sources       | Research data source registry      | name, publisher, license, data_type, category, metadata                 |
| datasets      | Dataset records linked to sources  | source_id FK, format, size_bytes                                        |
| indicators    | Economic and analytical indicators | source_id FK, category, unit, frequency                                 |
| analyses      | Analysis request tracking          | user_id FK, status (pending/running/completed/failed), parameters JSONB |
| scenarios     | Scenario definitions               | name, assumptions JSONB, parameters JSONB                               |
| forecasts     | Forecast projections               | analysis_id FK, target, method, values JSONB, confidence_lower/upper    |
| reports       | Research report storage            | user_id FK, content JSONB, format (json/pdf/html)                       |
| notifications | In-app notifications               | user_id FK, type, title, message, is_read                               |
| audit_log     | Security and admin audit trail     | user_id FK, action, resource_type, details JSONB                        |

### Intelligence tables

Migration `009_intelligence_pipeline.sql` extends this model with:

| Table                          | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| source_fetch_runs              | Per-fetch status, URL, byte count, hash and errors  |
| documents / document_versions  | Canonical documents and immutable content snapshots |
| document_relationships         | Duplicate, citation and update relationships        |
| claims / claim_entities        | Exact source spans and linked named entities        |
| evidence / claim_verifications | Evidence stances and append-only review history     |
| events / event_claims          | Structured events tied to supporting claims         |
| pipeline_jobs / job_attempts   | Durable queues, leases, retries and dead letters    |
| pipeline_workers               | Worker type, status and heartbeat                   |
| analysis_evidence              | Analysis citations to claims and evidence           |

## Data Flow for Manual Analyses

1. Express validates the request and inserts the `analyses` row plus `analysis.create` queue job in
   one transaction.
2. The API returns `202 Accepted` and the saved analysis ID.
3. The Rust worker claims the durable job, gathers the selected accessible records, and calls the
   Python service.
4. Python returns a structured result; Rust writes `analyses.result` and terminal status.
5. The frontend polls `/api/v1/analyses/:id`; history and detail pages remain usable while the
   request runs.

## Data Flow for Intelligence Extraction

`source.fetch` → document version → `document.extract_claims` → claims/entities/events →
`claim.find_evidence` → evidence records → `claim.verify` → immutable verification history →
`analysis.create` → cited report plus `analysis_evidence`.

Every downstream queue payload includes a contract version and shares a correlation ID. Job
idempotency keys allow safe retries without duplicating the final analysis or claim links.

## Data Catalogue

The data catalogue (`data/catalog/`) documents all approved data sources with:

- Publisher, canonical URL, license, update frequency
- Integration notes and API access methods
- Relevance to Open Polityra's research domains

All imported datasets must preserve source attribution and provenance metadata.
