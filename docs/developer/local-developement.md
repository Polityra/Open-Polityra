# Local development

## Workspace services

| Service | Directory | Development command | Local URL |
|---|---|---|---|
| Next.js web app | `apps/web` | `pnpm dev` | `http://localhost:3000` |
| Express API | `apps/api` | `pnpm dev` | `http://localhost:4000` |
| Python analysis worker | `services/analysis-worker` | `poetry run dev` | `http://localhost:8000` |

From the root, `pnpm dev` runs the web app and API. Run the Python worker from its own directory after `poetry install --with dev`.

## Configuration and persistence

Copy `.env.example` to `.env` and configure local API/database settings. PostgreSQL is needed for existing authenticated, database-backed API endpoints. The fiscal-balance data and analysis endpoints use the checked-in public-source snapshot and do not query PostgreSQL.

Do not use production credentials in local development. Keep local secrets out of commits, test fixtures, and logs.

## Common commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
python3 scripts/data/import_fiscal_data.py
python3 -m unittest scripts.data.test_import_fiscal_data
```

Use the smallest relevant check while iterating, then run the wider workspace checks before opening a pull request.