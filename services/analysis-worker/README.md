# Analysis worker

The worker is a separate Poetry-managed FastAPI service; it is not part of the pnpm workspace. The
fiscal-balance prototype currently runs its deterministic calculation in the Express API and does
not depend on this service.

## Requirements

- Python 3.11 or later
- Poetry 1.8 or later

## Install and run

```bash
poetry install --with dev
poetry run dev
```

The service listens on `http://localhost:8000`. Health endpoints are available at `/api/v1/health`
and `/api/v1/health/ready`; interactive API documentation is available at `/docs`.

The root `pnpm dev` command starts the worker alongside the web app and API. It uses
`services/analysis-worker/.venv` if present, or `poetry run dev` otherwise, and passes root `.env`
settings to the worker. Install the worker dependencies first.

## Checks

```bash
poetry run ruff check src tests
poetry run mypy src
poetry run pytest
```

Readiness checks the configured Ollama model, but is not proof of persistent storage or other
production integrations. Forecasts are simple moving-average baselines, not calibrated predictions;
they require at least ten observations, and their uncertainty bounds assume normality.
