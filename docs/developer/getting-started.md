# Getting started

## Prerequisites

- Git
- Node.js 22 or later, Corepack, and pnpm 10
- PostgreSQL 16+ for database-backed API features
- Python 3.11+ and Poetry 1.8+ only when working on the analysis worker

## Install

From the repository root:

```bash
corepack enable
pnpm install
cp .env.example .env
```

Review `.env.example` and set local values before starting the database-backed API. Never commit `.env` or paste credentials into issues.
For the World News Monitor, apply `packages/database/migrations/004_news_items.sql` once with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/migrations/004_news_items.sql`.

## Run applications

```bash
pnpm dev
```

This starts the web app and Express API in parallel. The web app is at `http://localhost:3000`; the API is at `http://localhost:4000`. The Python worker is separate:

```bash
cd services/analysis-worker
poetry install --with dev
poetry run dev
```

The worker listens on port 8000. The fiscal-balance research prototype uses the API's deterministic calculator and does not require the Python worker.
The API polls configured public RSS/Atom feeds on startup and every 15 minutes; manage feed domains and topics from the Sources page. Feed URLs must be HTTPS and on the configured source domain or a subdomain. Redirects are not followed, DNS results are checked and pinned to public addresses, and responses are limited to 2 MB and 10 seconds. Add only feeds you are permitted to access and review their publishers' reuse terms. No default feeds are bundled.

## Build and production start

```bash
pnpm build
pnpm start
```

`pnpm start` runs the built web app and API; it does not start the Python worker or provision PostgreSQL.

## Related instructions

- [Local development](./local-developement.md)
- [Testing](./testing.md)
- [Code standards](./code-standards.md)
- [Debugging](./debugging.md)