# System Overview — Open Polityra Platform

## Architecture Diagram (Text Description)

The diagram shows the intended service layout; the Python worker integration is not currently wired into the fiscal-balance prototype.

```
+------------------+       +----------------------+       +------------------------+
|  Next.js Front   | ----> |  Express Backend API | ----> |  PostgreSQL Database   |
|  apps/web/       |       |  apps/api/           |       |  packages/database/    |
|                  | <---- |                      | <---- |                        |
+------------------+       +----------------------+       +------------------------+
                                   |                           |
                                   v                           |
                          +-----------------+                  |
                          | Python Analysis |                  |
                          | Service         |                  |
                          | services/       |                  |
                          | analysis-worker |                  |
                          +-----------------+                  |
                                   ^                           |
                                   |                           |
                          +-----------------+                  |
                          | AI Provider     | <--------------+
                          | (local/remote)  |   Model queries
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

### Python Analysis Service (services/analysis-worker/)
- Separate FastAPI service with analysis and health routes
- Contains statistical, scenario, and provider scaffolding
- Is not currently invoked by the fiscal-balance prototype
- Its readiness response includes placeholders and does not verify external dependencies

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

Authenticated routes validate requests and use the API's data-access modules for configured database operations. The Python worker is a separate service; a general end-to-end API-to-worker-to-database analytical flow is not yet demonstrated.

## Security Model

- All external inputs validated at trust boundaries (Zod on Express, Pydantic on Python)
- Authentication via JWT tokens; authorization checked per-request
- Internal service communication authenticated and rate-limited
- No direct client-to-database or client-to-Python communication
