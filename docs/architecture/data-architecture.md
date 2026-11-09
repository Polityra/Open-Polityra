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

## Data Flow for Analyses

1. User submits analysis request via Express API → stored in `analyses` table
2. Express calls Python service (`pythonServiceClient.ts`) with structured request
3. Python service retrieves source data from PostgreSQL (if needed) and performs analysis
4. Python returns results to Express; Express stores result reference in `analyses.result_id`
5. Frontend polls `/api/v1/analyses/:id` for status updates until `completed`

## Data Catalogue

The data catalogue (`data/catalog/`) documents all approved data sources with:

- Publisher, canonical URL, license, update frequency
- Integration notes and API access methods
- Relevance to Open Polityra's research domains

All imported datasets must preserve source attribution and provenance metadata.
