# System Overview — Open Polityra Platform

## Architecture Diagram (Text Description)

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
- Database queries through repository pattern
- Business logic orchestration across modules
- Communication with Python analysis service
- Consistent JSON API responses with standardized error handling

### Python Analysis Service (services/analysis-worker/)
- Computational analysis: statistical methods, forecasting, scenario modeling
- AI-assisted synthesis via provider abstraction layer
- Data processing pipelines with provenance tracking
- Returns structured results with confidence levels and source attribution

### Shared Packages
- **@open-polityra/contracts**: Common data schemas for frontend, backend, and Python service
- **@open-polityra/api-client**: Typed client used by the frontend to call the backend API
- **@open-polityra/ui**: Shared design system components and tokens
- **@open-polityra/database**: PostgreSQL migrations, seed data, and query library
- **@open-polityra/observability**: Shared logging, tracing, and metrics configuration

## Data Flow

1. User initiates a request through the frontend
2. Frontend sends authenticated API call via `@open-polityra/api-client`
3. Express backend validates the request, checks permissions, and processes business logic
4. For analytical tasks, backend submits a structured request to the Python service
5. Python service retrieves relevant data from PostgreSQL and performs analysis
6. Results are returned with evidence, confidence levels, and methodology documentation
7. Backend formats the response and sends it to the frontend for display

## Security Model

- All external inputs validated at trust boundaries (Zod on Express, Pydantic on Python)
- Authentication via JWT tokens; authorization checked per-request
- Internal service communication authenticated and rate-limited
- No direct client-to-database or client-to-Python communication
