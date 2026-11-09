# Monitoring

No production monitoring service or on-call rotation is currently established by this repository.

Before operating a public deployment, maintainers should define service owners, alert thresholds,
log retention, escalation, privacy controls, and a tested incident process. Monitor availability and
error rates for the web app, API, database, and worker separately; distinguish application health
from external provider and data-source availability.

Do not put credentials, authorization headers, personal data, or sensitive request bodies in logs.
The worker's current health route contains placeholder dependency statuses and must not be used as a
production-readiness signal without implementation and review.
