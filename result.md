# Project status audit

**Reviewed:** 2026-11-04  
**Scope:** Project documentation and instructions, workspace configuration, application/service structure, and the available build, lint, test, and shell-script checks.

## Summary

The repository has a substantial **prototype scaffold**: public and dashboard pages, an Express API, shared TypeScript packages, database migrations, a Python analysis service, and policy/research documentation. It is **not yet a verified end-to-end research prototype**. Important workspace checks fail, several developer/operations/product guides are empty, and documented data, analysis, and report workflows are not complete.

The roadmap explicitly calls this early-stage and proposed work, so roadmap items below are described as outstanding rather than as missed delivery commitments.

## What is in place

- Project mission, contribution and governance policies, security/data/model policies, and a phased roadmap are present. See [README.md](README.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [ROADMAP.md](ROADMAP.md).
- The web app includes public pages and authenticated dashboard routes for the major research areas. Several views load records through the shared API client; examples include [DashboardClient.tsx](apps/web/src/app/(dashboard)/dashboard/DashboardClient.tsx) and [SourcesClient.tsx](apps/web/src/app/(dashboard)/dashboard/sources/SourcesClient.tsx).
- The API has routes/modules for authentication, sources, datasets, indicators, analyses, scenarios, forecasts, reports, notifications, and AI workflows. Database migrations and shared contracts/client packages are present.
- The Python service has FastAPI routes, basic descriptive/time-series analysis modules, and a local Ollama provider. Data-source catalogues, example data, and an indicator schema also exist.
- The frontend TypeScript check passed with `pnpm typecheck` in this environment. This only checked the web package; the API does not define a separate `typecheck` script.

## Missing or incomplete against the roadmap

1. **Phase 0 — project foundation:** Repository policies and a licence are present. Maintainer capacity, repository permissions, and review arrangements cannot be verified from these files.
2. **Phase 1 — traceable data foundation:** Finland-related research domains and public-source descriptions exist, but the roadmap’s single measurable research question and its reviewed research brief are not evident. The data-import script does not currently load data or validate it against the documented quality rules. Reproducible ingestion, freshness/revision handling, and end-to-end provenance still need to be demonstrated.
3. **Phase 2 — analytical prototype:** There are analytical modules and API/UI scaffolding, but key dashboard flows are read-only. “New scenario,” “New forecast,” and “New report” are explicitly disabled in the UI. A tested path from a documented source through a reproducible calculation to a result with assumptions, uncertainty, and source attribution remains outstanding.
4. **Phase 3 — AI evaluation:** Provider, prompt, model-card, and evaluation documentation exists, but no Python test files or evaluation runner/datasets were found in the checked paths. Repeatable factuality, citation, calibration, Finnish-language, and prompt-injection results are not established.
5. **Phases 4–6:** Public alpha review and institutional/foundation work are roadmap proposals, not demonstrated as completed.

## Broken or inconsistent items found

### Workspace checks

- **Build fails:** `pnpm build` stops in the API TypeScript build with `TS5103: Invalid value for '--ignoreDeprecations'`. The API sets this to `"6.0"` in [tsconfig.json](apps/api/tsconfig.json), while its declared TypeScript dependency is in the 5.x range in [package.json](apps/api/package.json). The web build was cancelled after the API failure and therefore was not verified.
- **Lint fails:** `pnpm lint` fails for the API because ESLint 9 cannot find a flat `eslint.config.*` file. The API has a legacy [.eslintrc.json](apps/api/.eslintrc.json); the shared config is written in flat-config form in [recommended.js](packages/config/eslint/recommended.js).
- **Tests fail:** `pnpm test` ran 7 API tests: 3 passed and 4 failed. The unit test imports in [env.test.ts](apps/api/tests/unit/config/env.test.ts) resolve to the wrong relative path. The integration tests in [app.test.ts](apps/api/tests/integration/app.test.ts) omit `DATABASE_URL`, which API initialization requires. The current root test run does not exercise web or Python tests.

### Setup and service instructions

- The root [README.md](README.md) says `pnpm dev` starts the analysis worker and suggests `pnpm dev` inside `services/analysis-worker`. The worker is deliberately excluded from pnpm workspaces in [pnpm-workspace.yaml](pnpm-workspace.yaml), has no `package.json`, and is configured as a Poetry project in [pyproject.toml](services/analysis-worker/pyproject.toml). The documented commands therefore do not start it.
- The worker’s Poetry script points to `analysis_worker.main:main`, but the checked source entry point is [main.py](services/analysis-worker/src/main.py). The service README at [README.md](services/analysis-worker/README.md) is empty. The documented worker launch/install steps need to be aligned with the actual package layout and tested.

### Data import and application behavior

- `bash -n scripts/data/import_validated_data.sh` fails: the `for` loop has a redirection in its word list. Even after fixing the syntax, the script currently only parses JSON, warns for sample files, and does not load records or validate CSV/schema/quality rules.
- The API helper [api.ts](apps/web/src/lib/api.ts) calls `/api/sources`, `/api/reports`, and `/api/analysis`, while the API routes use `/api/v1/...`. No callers of these helper functions were found in the web source, so this appears to be stale code rather than a verified live-page failure; update or remove it before reuse.
- In [DashboardHeader.tsx](apps/web/src/components/layout/DashboardHeader.tsx), the desktop and mobile search inputs have no search handler, and the notification button has no action. The provided user menu is wrapped in a settings link even though it contains a logout button (see [layout.tsx](apps/web/src/app/(dashboard)/layout.tsx)); separate the profile navigation from logout to avoid nested interactive controls and unintended navigation.

### Documentation gaps and drift

- These 13 documentation files are **zero bytes**: `docs/developer/{code-standards,debugging,getting-started,local-developement,testing}.md`, `docs/operations/{backups,deployment,disaster-recovery,incident-response,monitoring}.md`, and `docs/product/{requirements,use-cases,user-roles}.md`. This leaves the corresponding advertised setup, testing, operations, and product guidance unavailable.
- The root documentation describes `packages/observability`, but that package is absent from the current `packages/` tree. Confirm whether it is still planned; otherwise remove or correct the references in [README.md](README.md), [STRUCTURE.md](STRUCTURE.md), and [system-overview.md](docs/architecture/system-overview.md).
- [docs/architecture/system-overview.md](docs/architecture/system-overview.md) describes the analysis service retrieving data from PostgreSQL and returning provenance-rich results. That end-to-end path is not demonstrated by the checked worker setup or tests; document the current boundary and mark unimplemented flow as planned until it is wired and tested.

## Recommended next steps

1. Fix the TypeScript and ESLint configuration so `pnpm build` and `pnpm lint` can complete.
2. Correct API test import paths and supply isolated test configuration so all API tests pass without depending on a developer’s local database.
3. Repair the data-import script, then add a small reproducible ingestion test using the checked-in sample data.
4. Document and verify one end-to-end Finnish public-finance research question before expanding features, following the [roadmap exit criteria](ROADMAP.md).
5. Decide the supported worker launch/package layout; update the README and add a worker health/analysis test.
6. Fill the empty developer/product/operations guides, then implement or clearly label the disabled authoring flows and header controls.
