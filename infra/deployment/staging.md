# Staging Deployment — Open Polityra Platform

## Purpose

Staging mirrors production for pre-release validation before deploying to the live environment.

## Setup

1. Provision cloud resources matching production (same Postgres version, same Docker Compose stack)
2. Set `NODE_ENV=staging` in all service environment variables
3. Use separate staging database with sanitized production data copies
4. Deploy to staging subdomain (e.g., `staging.openpolityra.org`)

## Pre-Release Checklist

- [ ] All CI checks pass (frontend, backend, python, codeQL)
- [ ] Database migration run against staging Postgres successfully
- [ ] API health endpoints respond on all services
- [ ] Authentication flow works end-to-end
- [ ] Analysis service completes sample analysis within SLA
- [ ] No high-severity findings from dependency-review workflow
- [ ] Changelog verified for backward-compatible changes only

## Rollback Procedure

If staging deployment fails post-migration:

1. `docker compose -f infra/containers/docker-compose.yml down`
2. Restore database from pre-deployment backup
3. Re-deploy previous image tag
4. Investigate failure in staging logs before retry
