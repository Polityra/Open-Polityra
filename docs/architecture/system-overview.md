# System Overview — Open Polityra Platform

## Architecture Diagram (Text Description)

The platform combines a request/response frontend and API with separate durable data-processing and
analysis workers. The fiscal-balance prototype remains deterministic and does not require the
workers.

```
+------------------+       +----------------------+       +------------------------+
|  Next.js Front   | ----> |  Express Backend API | ----> |  PostgreSQL Database   |
|  apps/web/       |       |  apps/api/           |       |  packages/database/    |
|                  | <---- |                      | <---- |                        |
+------------------+       +----------------------+       +------------------------+
                                   |       durable jobs        |
                                   v                           v
                          +-----------------+       +----------------------+
                          | Python Analysis | <---> | Rust pipeline worker |
                          | Service         |       | services/rust/       |
                          | analysis-worker |       +----------------------+
                          +-----------------+
                                   |
                                   v
                          +-----------------+
                          | AI Provider     |
                          | (local/remote)  |
                          +-----------------+
```

## Component Responsibilities

### Frontend (apps/web/)

- User-facing dashboard, landing pages, and research tools
- Client-side state management and API client integration
- Data visualization using shared chart components
- Responsive design for desktop and mobile

### Backend API (apps/api/)

- Request validation, authentication, and authorization
- Database queries and business logic for existing application modules
- Public fiscal-balance data and deterministic scenario routes independent of the database
- Consistent JSON API responses with standardized error handling
- Enqueues analyses and source-processing work in PostgreSQL instead of holding browser requests
  open
- Exposes queue, worker, document, claim, evidence, review and analysis history APIs

### Rust Pipeline Worker (services/rust/)

- Claims durable PostgreSQL jobs with leases and `FOR UPDATE SKIP LOCKED`
- Performs bounded HTTPS feed fetching, SSRF checks, normalization, hashing and deduplication
- Orchestrates Python extraction, verification and cited report stages
- Publishes worker heartbeats and structured job failures

### Python Analysis Service (services/analysis-worker/)

- Separate FastAPI service with analysis and health routes
- Contains statistical, scenario, and provider scaffolding
- Provides typed claim/entity/event extraction, evidence matching and deterministic report endpoints
- Is optional for the fiscal-balance prototype

### Shared Packages

- **@open-polityra/contracts**: Common data schemas for frontend, backend, and Python service
- **@open-polityra/api-client**: Typed client used by the frontend to call the backend API
- **@open-polityra/ui**: Shared design system components and tokens
- **@open-polityra/database**: PostgreSQL migrations, seed data, and query library

## Data Flow

### Fiscal-balance prototype

1. The dashboard calls the public-source research endpoints through `@open-polityra/api-client`.
2. The Express API reads and validates the checked-in Eurostat snapshot.
3. The analysis route validates scenario inputs and calculates deterministic illustrative paths.
4. The dashboard presents observed values, scenarios, source metadata, assumptions, and limitations.

This flow does not use PostgreSQL or the Python worker.

### Existing database-backed application routes

Authenticated analysis routes create a `pending` analysis and durable `analysis.create` job. The
frontend can navigate away and poll the saved analysis ID. The Rust worker consumes the job, gathers
authorized database context, calls the Python service and writes the final result or retryable
failure state.

## Security Model

- All external inputs validated at trust boundaries (Zod on Express, Pydantic on Python)
- Authentication via JWT bearer tokens; authorization checked per-request
- Rust-to-Python internal routes accept the server-only `INTERNAL_SERVICE_TOKEN`
- No direct client-to-database or client-to-Python communication
