# Analysis worker

The worker is a separate Poetry-managed FastAPI service; it is not part of the pnpm workspace. The fiscal-balance prototype currently runs its deterministic calculation in the Express API and does not depend on this service.

## Requirements

- Python 3.11 or later
- Poetry 1.8 or later

## Install and run

```bash
poetry install --with dev
poetry run dev
```

The service listens on `http://localhost:8000`. Health endpoints are available at `/api/v1/health` and `/api/v1/health/ready`; interactive API documentation is available at `/docs`.

## Checks

```bash
poetry run ruff check src tests
poetry run mypy src
poetry run pytest
```

The current worker includes placeholder readiness checks and a local storage implementation. Do not treat its health response as proof that external AI providers, persistent storage, or production integrations are available.
