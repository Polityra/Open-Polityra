# Deployment

This repository does not establish a production deployment target or a supported public service. The scripts and configuration are development scaffolding; deployment must be reviewed and configured by project maintainers before use.

## Before deploying

- Select and document the hosting environment, data residency, domain, and service ownership.
- Set secrets through the platform's secret manager; do not commit `.env`.
- Provision and secure PostgreSQL for database-backed API functionality.
- For Vercel Services, leave `NEXT_PUBLIC_API_URL` unset so the browser uses the same-origin `/api/v1` route to the API service. If the variable is set to a localhost URL in production, the frontend ignores it and uses the same-origin route.
- For deployments where the API is hosted separately, set `NEXT_PUBLIC_API_URL` to its HTTPS origin (without an `/api` path), and configure CORS and authentication appropriately.
- Review the Python worker's permissive development CORS setting and placeholder readiness checks before exposing it.
- Test build, migrations, health/readiness semantics, backup restoration, logging, and rollback procedures in a non-production environment.
- Publish an alpha disclaimer, supported-use policy, and contact path for security reports.

The fiscal-balance prototype serves a checked-in public-data snapshot. Refreshing it is a separate source-data operation and should be reviewed before publication.