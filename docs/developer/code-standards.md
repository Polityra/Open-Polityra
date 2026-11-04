# Code standards

- Keep changes focused and preserve existing behavior outside the requested scope.
- Prefer typed interfaces, explicit validation, and visible errors over unchecked input or silent fallbacks.
- Keep source provenance, transformations, assumptions, and limitations alongside research data and calculations.
- Distinguish observed values from estimates and illustrative scenarios. Do not present prototype scenarios as forecasts.
- Avoid adding AI-generated factual claims where a deterministic calculation suffices.
- Add or update tests when behavior changes; update directly related documentation.
- Never add credentials, sensitive personal data, classified data, or unlicensed third-party material.

## Language-specific checks

- TypeScript: follow the package ESLint and TypeScript configuration; run the applicable `pnpm` checks.
- Python: follow Ruff and mypy configuration; run checks from the analysis-worker directory with Poetry.
- Keep API request bounds and response types explicit; do not broaden a public endpoint without a documented use case.

## Pull requests

Use the repository pull-request template. Explain the behavior change, tests run, data/source changes, and known limitations. Research changes should include the question, definitions, transformations, assumptions, source/license, and reproducible sample results.