# Production Deployment — Open Polityra Platform

## Architecture
- Reverse proxy (Caddy or Nginx) → TLS termination, HTTP/2
- Express API (api:3001) and Next.js frontend (web:3000) behind reverse proxy
- Python analysis service (worker:8000) on internal network only
- PostgreSQL 16+ in managed/cloud-hosted instance (not containerized in production)

## Environments
| Environment | Domain | Purpose | Auth Required |
|---|---|---|---|
| Production | `openpolityra.org` | Live platform | Yes for all data access |
| Staging | `staging.openpolityra.org` | Pre-release validation | Yes |

## Deployment Steps
1. Merge to `main` branch (or deploy specific tag)
2. CI workflows run: frontend lint/build, backend tests + typecheck, python ruff/mypy/pytest
3. On pass: `docker compose -f infra/containers/docker-compose.yml pull && docker compose up -d`
4. Run database migrations in order: `scripts/database/migrate.sh --environment production`
5. Verify health endpoints: `/health` on all services
6. Monitor logs for 10 minutes post-deploy

## Security Requirements
- All credentials from secret manager (never env vars in compose files)
- TLS 1.2+ only, HSTS enabled
- Rate limiting active on all public endpoints
- Audit log retention: 90 days minimum
- Automated backups daily for PostgreSQL

## Monitoring
- Health checks every 30s (configured in Docker or orchestrator)
- Winston logs forwarded to centralized logging (Elasticsearch or equivalent)
- Performance metrics exported via OpenTelemetry conventions (`packages/observability/`)
