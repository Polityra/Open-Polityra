# Operating the intelligence pipeline

## Required processes

Run PostgreSQL, the Express API, the FastAPI analysis worker and the Rust pipeline worker. The web
and Express services can run on Vercel; the Rust and Python workers must run as durable services.

`pnpm dev` starts the Node workspace and Python service. Start the Rust queue consumer separately
unless using Docker Compose:

```bash
cargo run --manifest-path services/rust/Cargo.toml --bin polityra-ingestion
```

For local containers:

```bash
docker compose -f infra/containers/docker-compose.yml up --build
```

## Scheduling

Configure Vercel `CRON_SECRET` and schedule `/api/v1/pipeline/schedule`. The route only adds
idempotent `source.fetch` jobs. The Rust worker is responsible for fetching and every downstream
stage.

Authenticated operations:

- `GET /api/v1/pipeline/jobs`
- `GET /api/v1/pipeline/workers`
- `POST /api/v1/pipeline/sources/:id/enqueue`
- `POST /api/v1/pipeline/jobs/:id/retry`
- `GET /api/v1/intelligence/documents`
- `GET /api/v1/intelligence/documents/:id`
- `GET /api/v1/intelligence/claims`
- `GET /api/v1/intelligence/claims/:id`
- `POST /api/v1/intelligence/claims/:id/review`
- `GET /api/v1/intelligence/events`

## Diagnosing jobs

1. Inspect pending, failed and dead-letter rows through `GET /api/v1/pipeline/jobs`.
2. Compare `pipeline_job_attempts.error_message` for each attempt.
3. Inspect the source's `source_fetch_runs` and the last successful/failed timestamps.
4. Check `document_versions` before re-running changed content.
5. Use the retry endpoint only after correcting the underlying error.

The worker emits JSON logs with job ID, job type and structured errors. Every downstream job shares
a correlation ID. Worker shutdown honors SIGINT/CTRL-C; leased jobs become claimable after
expiration if the process is terminated unexpectedly.

## Environment

- `DATABASE_URL`
- `PYTHON_SERVICE_URL`
- `INTERNAL_SERVICE_TOKEN`
- `PIPELINE_POLL_INTERVAL_MS`
- `CRON_SECRET`
- `ANALYSIS_ALLOWED_ORIGINS`

Do not expose `INTERNAL_SERVICE_TOKEN` to browser code. A Vercel-hosted worker cannot use a
developer's localhost Ollama instance; point it to an authenticated, network-reachable inference
service or run the complete stack on private infrastructure.
