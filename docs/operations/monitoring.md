# Monitoring

No production monitoring service or on-call rotation is currently established by this repository.

Before operating a public deployment, maintainers should define service owners, alert thresholds,
log retention, escalation, privacy controls, and a tested incident process. Monitor availability and
error rates for the web app, API, database, and worker separately; distinguish application health
from external provider and data-source availability.

Do not put credentials, authorization headers, personal data, or sensitive request bodies in logs.
The FastAPI readiness route reports internal service state and the configured model check. The Rust
worker writes a heartbeat to `pipeline_workers` and exposes it through
`GET /api/v1/pipeline/workers`; a worker is considered stale after 45 seconds. Alert on stale
heartbeats, dead-letter jobs, repeated fetch failures, lease expiry and growing pending queues.
