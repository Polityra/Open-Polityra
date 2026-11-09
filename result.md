# Project audit and phase completion report

**Reviewed:** 2026-11-04  
**Scope:** Project documentation and instructions, workspace configuration, application behavior,
and Phases 0–2.

## Summary

The repository now contains a working, deterministic Finland fiscal-balance prototype spanning a
sourced data snapshot, validation/import tooling, API endpoints, and an interactive dashboard.
Repository-controlled Phase 0 documentation and setup fixes are in place. Phase 0 cannot be declared
fully signed off because maintainer capacity, repository permissions, policy review, and external
review are not verifiable from this workspace.

Phases 1 and 2 are implemented as a **prototype**, not independently research-validated or
production-ready. The prototype presents historical observations separately from illustrative
scenarios and includes assumptions, source information, and limitations. See the
[research brief](research/domains/finnish-economy/fiscal-balance-brief.md),
[ADR-0002](docs/decisions/ADR-0002-fiscal-balance-prototype.md), and [roadmap status](ROADMAP.md).

## Phase status

| Phase                    | Repository implementation                                                                                                                                                                                            | Remaining exit criteria                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation           | Project policies/licence and repository scaffolding exist; previously empty developer, operations, and product guides are now populated; setup, worker instructions, CI, and root production start are aligned.      | Maintainer/reviewer availability, repository/org permissions, and external policy review remain unverified.   |
| 1 — Research and data    | Project-owner-selected question; research brief; Eurostat B9/GD source metadata and dated 2000–2025 fixture; schema; refresh/validation importer; validation tests.                                                  | Independent economics/statistics review and source revision review remain outstanding.                        |
| 2 — Analytical prototype | Tested database-independent API for source data and bounded deterministic scenarios; typed client; dashboard with observed and projected chart lines, assumptions, update/retrieval dates, reuse terms, and caveats. | Independent researcher reproduction/review remains outstanding; no uncertainty quantification is implemented. |

## Implemented and repaired

- Added the Eurostat snapshot at
  [finland_fiscal_balance.json](data/examples/finland_fiscal_balance.json), JSON Schema, and
  importer. Validation checks required metadata, indicators, numeric values, debt bounds, and
  ascending unique years; refresh writes only after both source series validate.
- Added API routes at `/api/v1/research/fiscal-balance/data` and
  `/api/v1/research/fiscal-balance/analyze`. The analysis endpoint validates inputs and returns
  baseline, stress, and gradual-improvement paths using the documented simplified debt-ratio
  equation.
- Added the economy dashboard research panel. It separates observations from scenarios and shows
  source, coverage, retrieval/source update dates, reuse terms, formula, assumptions, and
  limitations.
- Added API and Python importer tests, plus a worker health/readiness test. Updated worker packaging
  instructions and changed CI from incompatible `uv sync` commands to Poetry commands.
- Added a root `start` script for the built web/API apps and corrected README/developer instructions
  so the separate Python worker is not presented as part of the pnpm workspace.
- Filled previously empty developer, operations, and product guides; added ADR-0002; corrected
  architecture docs about the fiscal flow and unimplemented worker integration.
- Updated the stale web API helper to use versioned routes and corrected response shapes. Separated
  the account-settings link from logout to avoid wrapping an interactive button in a link.
- Existing generic “new scenario/report/forecast” controls remain intentionally disabled; authoring
  those broader product flows is not necessary for this narrow fiscal prototype.

## Known limitations and outstanding work

- Maintainer capacity, GitHub organization/repository permissions, and external sign-off cannot be
  verified locally.
- No independent domain reviewer has approved the research definitions, Eurostat snapshot, or
  scenario assumptions.
- Scenario paths are illustrative calculations—not forecasts or policy recommendations—and omit
  stock-flow adjustments and other national-accounting effects.
- The worker remains separate; its readiness checks and integrations are placeholders. Poetry-based
  worker CI could not be fully certified without the Poetry environment.
- The dashboard header's search and notification controls still lack functional
  destinations/handlers.
- Later roadmap phases (AI-assisted explanation/evaluation, public alpha review, domain expansion,
  and institutional development) remain out of scope.

## Validation

- `pnpm build` — passed for the API and web app.
- `pnpm lint` — passed with 11 pre-existing API warnings and 9 pre-existing web warnings; no lint
  errors.
- `pnpm test` — passed; 15 API tests.
- `pnpm typecheck` — passed for the configured web TypeScript check.
- `python3 scripts/data/import_fiscal_data.py` — passed; 26 snapshot observations validated.
- `python3 -m unittest scripts.data.test_import_fiscal_data` — passed; 5 importer tests.
- `bash -n scripts/data/import_validated_data.sh` and `git diff --check` — passed; no empty files
  remain under `docs/`.
- The compiled API was started on an isolated port (4001); `/health` and the fiscal data endpoint
  returned successfully, including all 26 observations.
- A default-port `pnpm start` smoke test could not complete because pre-existing local development
  servers occupied ports 3000/4000. The independent Next.js instance on port 3000 returned HTTP 200,
  but that response is not attributed to this smoke test.
- Python worker tests were not run because Poetry/FastAPI are unavailable in the local environment.
  Its 30 Python source/test files passed syntax parsing; the CI workflow runs worker tests in a
  Poetry environment.
