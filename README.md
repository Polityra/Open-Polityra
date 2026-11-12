<a href="https://facebook.com/zel.pon">
  <img
    alt="Repository banner"
    width="1100"
    src="https://repository-images.githubusercontent.com/1445344815/d90ab79d-be9f-421e-b2e8-2ec518092c8d"
  />
</a>

# Open Polityra

**Independent open-source research and strategic intelligence platform for transparent,
source-grounded analysis using public data.**

> This is an independent, early-stage project. It is not an official government system, public
> authority, political party, or government commission. It does not make or automate public
> decisions. Human institutions remain responsible for all decisions.

## Project status

The repository is an evolving project scaffold. Features, datasets, models, research methods, and
governance arrangements may be incomplete or experimental. Do not use prototype outputs as the sole
basis for financial, public-policy, security, or operational decisions.

## Goals

- Bring together public, lawfully usable information from documented sources to study global
  economics, geopolitics, security, resilience, energy, and governance.
- Support analysis of economic indicators, geopolitical developments, national and international
  security, cybersecurity, public services, and critical infrastructure.
- Compare transparent scenarios and assumptions rather than present one predetermined political
  answer.
- Make methods, limitations, uncertainty, and source provenance inspectable.
- Evaluate models against historical data and independent human review.
- Build an open community for software engineering, research, and public-interest technology.

## Non-goals

- Replacing democratic processes, public authorities, courts, or legislative bodies.
- Giving an AI system political authority or autonomous decision-making power.
- Producing classified intelligence or collecting non-public sensitive information.
- Providing operational instructions for cyberattacks, violence, or other harm.
- Claiming that forecasts are facts or that scenarios are certain predictions.
- Presenting AI-generated analysis as verified factual conclusions without human review.

## Repository structure

| Path                        | Purpose                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `apps/web/`                 | Next.js frontend — research platform dashboard, landing pages, reports                        |
| `apps/api/`                 | Express backend API — auth, sources, datasets, analyses, reports, and RSS/Atom news ingestion |
| `services/analysis-worker/` | Python analysis engine — forecasting, scenario modeling, AI-assisted analysis                 |
| `packages/contracts/`       | Shared schemas and API contracts across all services                                          |
| `packages/api-client/`      | Typed frontend API client                                                                     |
| `packages/ui/`              | Shared design system and reusable components                                                  |
| `packages/database/`        | PostgreSQL migrations, seeds, and query library                                               |
| `data/`                     | Data source catalogues, schemas, validation rules, sample fixtures                            |
| `research/`                 | Research methods, domain studies, working papers, publications                                |
| `models/`                   | AI model registry, prompts, adapters, and model cards                                         |
| `evaluation/`               | Benchmarks, backtesting, calibration, bias evaluation, security testing                       |
| `governance/`               | Project governance, community rules, ethics, foundation planning                              |
| `docs/`                     | Architecture, product specs, developer guides, operations manuals                             |
| `infra/`                    | Local and deployment infrastructure (PostgreSQL, Redis, containers)                           |
| `scripts/`                  | Setup, database, data import, and release automation                                          |
| `tests/`                    | Cross-application integration, e2e, performance, and security tests                           |
| `.github/`                  | Issue templates, CI/CD workflows, repository automation                                       |

## Getting started

### Prerequisites

- Git
- Node.js 22 or later
- pnpm 10
- Python 3.11 or later (for the analysis service)
- PostgreSQL 16+ for application persistence (or `docker compose` from `infra/`)

### Setup

```bash
git clone https://github.com/REPLACE_WITH_ORG/open-polityra.git
cd open-polityra

corepack enable
pnpm install

cp .env.example .env
```

Python analysis worker setup:

```bash
cd services/analysis-worker
pipx install poetry
poetry install --with dev
```

Install and start local Ollama, then pull the configured model:

```bash
ollama pull olmo-3:7b
ollama serve
```

Set `AI_MODEL=olmo-3:7b` for the Express API and `OLLAMA_MODEL=olmo-3:7b` for the Python worker.
Both services use `OLLAMA_BASE_URL` to reach the local Ollama instance. In `infra/containers`,
Docker Compose starts an Ollama service; run
`docker compose -f infra/containers/docker-compose.yml exec ollama ollama pull olmo-3:7b` before
running analyses.

The Compose database applies every migration when creating a new volume. The following script
reapplies every migration and is intended only for a fresh database:

```bash
DATABASE_URL=postgresql://postgres:change_me@localhost:5432/open_polityra ./scripts/database/migrate.sh
```

For an existing database with migrations through `005` already applied, export `DATABASE_URL` and
apply the analysis migrations individually before starting the API:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/migrations/006_analysis_results.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/migrations/007_automatic_news_analyses.sql
```

### Development commands (root)

```bash
pnpm dev          # Start the web app, API, and analysis worker in parallel
pnpm build        # Build all apps and packages
pnpm start        # Start the built web app and API in parallel
pnpm lint         # Lint all code
pnpm typecheck    # Run configured TypeScript checks
pnpm test         # Run configured Node workspace tests
```

### Frontend development

```bash
cd apps/web && pnpm dev   # http://localhost:3000
```

### Backend development

```bash
cd apps/api && pnpm dev   # http://localhost:4000
```

### Python analysis service

```bash
cd services/analysis-worker && poetry run dev   # http://localhost:8000
```

The Python worker dependencies are managed separately from the pnpm workspace, but `pnpm dev` starts
the worker automatically after setup. Analysis requests use only database-derived context and/or
caller-supplied observed values; the worker does not invent fallback observations. The
fiscal-balance prototype uses a deterministic calculation in the Express API.

When the API ingests a new news item, it also queues a shared analysis in the same database
transaction. The API processes queued items in the background, and failed jobs are retried after 15
minutes. Results and failures appear on the dashboard for signed-in users. The worker and configured
Ollama model must both be available; generated summaries require human review. Apply all pending
database migrations, including `006_analysis_results.sql` and `007_automatic_news_analyses.sql`,
before starting the API.

For news sources, the API checks the supplied feed and discovers advertised same-domain RSS/Atom
feeds or common paths when necessary. Only public HTTPS hosts within the source domain are accepted.
Discovery does not crawl the site and may require a manually supplied feed URL.

## Architecture overview

1. **User** → interacts with the Next.js frontend (`apps/web/`)
2. **Frontend** → uses the shared API client (`packages/api-client/`)
3. **API Client** → communicates with the Express backend (`apps/api/`)
4. **Express Backend** → validates requests, checks auth/permissions, accesses PostgreSQL
5. **Python Analysis Service** → handles computational analysis (forecasting, scenario modeling,
   AI-assisted analysis)
6. **Results** → returned through Express to the frontend for display with evidence and uncertainty

## Development principles

1. **Evidence before narrative:** material claims should link to traceable sources.
2. **Human accountability:** outputs inform people; they do not make public decisions.
3. **Plurality:** show competing explanations and policy options fairly.
4. **Uncertainty:** distinguish observations, estimates, assumptions, and scenarios.
5. **Privacy and minimisation:** collect only data necessary for a defined purpose.
6. **Security by design:** use public data by default and protect credentials.
7. **Reproducibility:** version data snapshots, methods, model configurations, and results.
8. **Independent evaluation:** measure factuality, calibration, robustness, and bias.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md),
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md) before contributing.

For research contributions, include methodology, assumptions, sources, limitations, and
reproducibility information. For code contributions, include tests and update relevant
documentation.

## Governance and foundation status

The project may explore establishing a legal foundation in the future. No foundation should be
represented as established until it has been legally founded and registered where required. Until
then, governance documents are proposals for community discussion, not binding foundation rules.

## Licensing

- Software: Apache License 2.0, see [`LICENSE`](LICENSE).
- Project documentation: intended CC BY 4.0 where explicitly marked.
- Datasets, model weights, and third-party materials: their own licenses and terms.
- Branding and trademarks: not automatically licensed for unrestricted use.

See [LICENSES.md](LICENSES.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Disclaimer

This project is provided for research, education, and decision-support development. It is provided
without warranty. Outputs may be incomplete, incorrect, outdated, or misleading. Users must
independently verify information and consult qualified experts before relying on it.

## Contact

Until official project contact channels are published, use GitHub Discussions or Issues for
non-sensitive questions. Never disclose vulnerabilities, personal data, credentials, or confidential
information in public issues.
