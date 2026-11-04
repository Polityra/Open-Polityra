# Debugging

## First checks

1. Confirm required local services are running and their ports are free.
2. Check `.env` against `.env.example` without sharing secret values.
3. Run the narrowest relevant test or type check.
4. Inspect the API response status and structured error; do not infer database or provider health from a different route.

## Common issues

- **API database-backed endpoint fails:** verify local PostgreSQL availability and `DATABASE_URL`; public fiscal-balance endpoints are independent of the database.
- **Fiscal snapshot fails validation:** run `python3 scripts/data/import_fiscal_data.py` and inspect the reported field. Do not hand-edit a refresh result without rerunning validation and tests.
- **Refresh fails:** check network access and Eurostat availability; the checked-in dated fixture remains usable offline.
- **Python worker does not start:** from `services/analysis-worker`, run `poetry install --with dev`, then `poetry run dev`; the worker is not started by root `pnpm dev`.
- **Web app cannot reach API:** check `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`) and the API process.

Never log or publish access tokens, passwords, private user data, or full secret-bearing environment files.