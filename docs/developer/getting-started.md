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