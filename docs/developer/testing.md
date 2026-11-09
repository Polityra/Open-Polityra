# Testing

## Node workspace

Run from the repository root:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

The API tests use Vitest and Supertest. They stub test environment variables and should not require
a live database for route tests that do not access persistence. The root test command does not by
itself exercise the Python worker or every browser interaction.

## Fiscal data

```bash
python3 scripts/data/import_fiscal_data.py
python3 -m unittest scripts.data.test_import_fiscal_data
```

The checked-in snapshot validation is offline. `--refresh` makes network requests to Eurostat; tests
should use the fixture and not depend on live source availability.

## Python worker

From `services/analysis-worker`:

```bash
poetry install --with dev
poetry run ruff check src tests
poetry run mypy src
poetry run pytest
```

## Expectations

Add focused tests for changed behavior, validation failures, and error responses. Do not treat an
unconfigured service stub, synthetic data, or a passing health route as evidence that external
integrations work.
