# Finland fiscal balance and debt: research brief

**Status:** Prototype scope selected by the project owner; independent economics/statistics review
pending  
**Scope date:** 2026-11-04

## Research question

How have Finland's general-government deficit/surplus and gross debt changed, and how do transparent
assumptions alter illustrative debt paths?

This is a descriptive public-finance prototype. It does not evaluate individual policies, recommend
fiscal actions, or provide an official forecast.

## Scope and measures

- Geography: Finland (`FI`).
- Government sector: general government (`S13`).
- Frequency and unit: annual, percent of GDP.
- Observed period in the checked-in snapshot: 2000–2025.
- Net lending/borrowing: Eurostat `B9`; positive values denote net lending (surplus), negative
  values net borrowing (deficit).
- Consolidated gross debt: Eurostat `GD`.
- Primary source: Eurostat dataset
  [`gov_10dd_edpt1`](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10dd_edpt1).
  The source metadata and Eurostat reuse terms are recorded with the fixture at
  [`data/examples/finland_fiscal_balance.json`](../../../data/examples/finland_fiscal_balance.json).

## Reproducible data workflow

The dated fixture is validated by `python3 scripts/data/import_fiscal_data.py`. To request a refresh
from Eurostat, run `python3 scripts/data/import_fiscal_data.py --refresh`. Refreshing requires
network access and replaces the fixture atomically only after both indicators are fetched and
validated.

The ingestion pipeline matches the two indicators by year, excludes years missing either value,
validates numeric values and ascending unique years, and records the retrieval date and source
update timestamp. Eurostat may revise historical observations; a refreshed snapshot is a new as-of
view, not an immutable version history.

## Illustrative calculation

For each projected year:

`debt_ratio_next = debt_ratio_current × (1 + effective_interest_rate) / (1 + nominal_GDP_growth) − net_lending_ratio`

All rates and balances are expressed in percentage points/percent, respectively. A surplus is
positive and reduces the debt ratio; a deficit is negative and raises it. The API offers:

- **Baseline:** latest observed balance held constant; 3% nominal GDP growth and 3% effective
  interest.
- **Stress:** user-selected annual change in the balance (default −0.5 percentage points), nominal
  GDP growth (default 1%), and effective interest (default 5%).
- **Gradual improvement:** balance improves by 0.5 percentage points each year; 3% nominal GDP
  growth and 3% effective interest.

The projection horizon is 1–10 years. Input bounds are enforced by the API. Calculations are
deterministic and contain no AI-generated statements.

## Limitations

- This is a simplified debt-ratio identity, not a complete fiscal projection model.
- Stock-flow adjustments, asset changes, maturity structure, inflation composition, and other
  national-accounting effects are omitted.
- The assumptions are illustrative, not probabilistic, calibrated, independently endorsed, or a
  prediction.
- Observed statistical series may be revised; values should be checked against the live Eurostat
  source before reuse.
- The first implementation does not quantify uncertainty or assess causal policy effects.
- Independent domain review and replication remain outstanding before claims of research validation.

## Reproduction and checks

- Validate source fixture: `python3 scripts/data/import_fiscal_data.py`
- Run importer tests: `python3 -m unittest scripts.data.test_import_fiscal_data`
- Run API tests: `pnpm --filter @open-polityra/api test`
- The `/api/v1/research/fiscal-balance/data` endpoint returns the attributed fixture.
- The `/api/v1/research/fiscal-balance/analyze` endpoint returns observations and clearly labeled
  scenarios.
