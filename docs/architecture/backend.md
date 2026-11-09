# Backend API Architecture — Open Polityra Platform

## Technology Stack

- **Runtime**: Node.js 22+ with Express
- **Language**: TypeScript
- **Validation**: Zod for runtime validation of all external inputs
- **Database**: PostgreSQL via pg-pool
- **Authentication**: JWT tokens (http-only cookies)
- **Logging**: Winston structured logging (@open-polityra/observability/logging)
- **Rate Limiting**: express-rate-limit

## Module Structure

```
apps/api/src/
├── app.ts                     # Express app setup, middleware, router registration
├── server.ts                  # HTTP server startup, graceful shutdown
├── config/
│   ├── env.ts                 # Environment variable validation (Zod schema)
│   └── database.ts            # PostgreSQL connection pool from env vars
├── middleware/
│   ├── auth.ts                # JWT authentication middleware
│   ├── rateLimiter.ts         # Rate limiting configuration
│   ├── errorHandler.ts        # Centralized error handling
│   └── requestLogger.ts       # Winston-based request logging
├── routes/index.ts            # Route registration: /api/v1/*
├── modules/                   # Domain-specific module implementations
│   ├── auth/                  # Registration, login, session management
│   ├── users/                 # User CRUD and profile management
│   ├── sources/               # Research source registry
│   ├── datasets/              # Dataset management
│   ├── indicators/            # Economic and analytical indicators
│   ├── analyses/              # Analysis request lifecycle (submit -> run -> results)
│   ├── scenarios/             # Scenario creation and comparison
│   ├── forecasts/             # Forecast storage and retrieval
│   ├── reports/               # Report storage and export
│   ├── model-registry/        # AI model metadata management
│   ├── notifications/         # In-app notifications
│   └── audit/                 # Security and admin audit log
├── services/                  # Cross-module services
│   └── pythonServiceClient.ts # HTTP client for Python analysis service
├── repositories/              # Database access layer
│   ├── source.repository.ts   # Source CRUD operations
│   └── user.repository.ts     # User data access
├── errors/appError.ts         # Custom error classes (AppError, NotFoundError, etc.)
└── utils/                     # Shared utilities
```

## API Response Convention

All endpoints return:

```json
{
  "ok": true,
  "data": { ... },
  "meta": { "requestId": "uuid", "timestamp": "ISO8601" }
}
// or on error:
{
  "ok": false,
  "error": { "code": "not_found", "message": "Resource not found" }
}
```

## Route Registration (api/v1/)

| Method   | Path          | Purpose                     | Auth Required |
| -------- | ------------- | --------------------------- | ------------- |
| GET      | /health       | Service health check        | No            |
| POST     | /auth/login   | User authentication         | No            |
| POST     | /auth/logout  | Session invalidation        | Yes           |
| GET      | /users        | List users                  | Yes (admin)   |
| GET      | /users/:id    | Get user by ID              | Yes           |
| GET      | /sources      | List sources (paginated)    | Yes           |
| POST     | /sources      | Register new source         | Yes (editor+) |
| GET      | /datasets     | List datasets               | Yes           |
| GET      | /indicators   | List indicators by category | Yes           |
| POST     | /analyses     | Submit analysis request     | Yes           |
| GET      | /analyses/:id | Get analysis status/results | Yes (owner)   |
| GET/POST | /scenarios    | Scenario CRUD               | Yes           |
| GET      | /forecasts    | Forecast retrieval          | Yes           |
| GET/POST | /reports      | Report CRUD and export      | Yes           |
