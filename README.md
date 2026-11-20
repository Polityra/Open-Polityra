<a href="https://github.com/Polityra/Open-Polityra">
  <img
    alt="Repository banner"
    width="1100"
    src="https://repository-images.githubusercontent.com/1445344815/d90ab79d-be9f-421e-b2e8-2ec518092c8d"
  />
</a>

# Open Polityra

**Independent open-source research and strategic intelligence platform for transparent,
source-grounded analysis using public data.**

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Status: early-stage](https://img.shields.io/badge/status-early--stage-orange.svg)](#project-status)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

Website: [open.polityra.org](https://open.polityra.org)

> This is an independent, early-stage project. It is not an official government system, public
> authority, political party, or government commission. It does not make or automate public
> decisions. Human institutions remain responsible for all decisions.

## Contents

- [What is Open Polityra?](#what-is-open-polityra)
- [Project status](#project-status)
- [Goals](#goals)
- [Non-goals](#non-goals)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Architecture overview](#architecture-overview)
- [AI models and providers](#ai-models-and-providers)
- [Development principles](#development-principles)
- [Get involved](#get-involved)
- [Community and communication](#community-and-communication)
- [Sponsors and supporters](#sponsors-and-supporters)
- [Governance and foundation status](#governance-and-foundation-status)
- [Licensing](#licensing)
- [Disclaimer](#disclaimer)
- [Contact](#contact)

## What is Open Polityra?

Open Polityra is a community-built platform for analysing geopolitical and global developments
using **public, lawfully usable data**. It supports risk analysis, scenario comparison and
source-grounded reporting. Every material claim should be traceable to a source, every model output
requires human review, and methods and limitations are kept inspectable.

Typical use cases:

- Monitoring and summarising public news and data feeds across regions and topics.
- Comparing transparent scenarios and assumptions instead of single "predictions".
- Risk analysis for economics, energy, security, critical infrastructure and governance.
- Evaluating AI models against historical data and independent human review.

## Project status

The repository is an evolving project scaffold. Features, datasets, models, research methods, and
governance arrangements may be incomplete or experimental. Do not use prototype outputs as the sole
basis for financial, public-policy, security, or operational decisions.

See [ROADMAP.md](ROADMAP.md) for planned work and [CHANGELOG.md](CHANGELOG.md) for changes.

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
| `apps/web/`                 | Next.js dashboard, landing pages, analysis history, reports and human review                  |
| `apps/api/`                 | Express backend API — auth, sources, datasets, analyses, reports, and RSS/Atom news ingestion |
| `services/analysis-worker/` | Python extraction and analysis service                                                        |
| `services/rust/`            | Durable queue worker, ingestion, normalization, hashing and deduplication                     |
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
- pnpm 12 (matching the root `packageManager` version)
- Python 3.11 or later (for the analysis service)
- Rust stable toolchain with Cargo (for the durable pipeline worker)
- PostgreSQL 16+ for application persistence (or `docker compose` from `infra/`)

### Setup

```bash
git clone https://github.com/Polityra/Open-Polityra.git
cd Open-Polityra

corepack enable
pnpm install

cp .env.example .env
```

Set strong values for `JWT_SECRET`, `CRON_SECRET` and `INTERNAL_SERVICE_TOKEN`. The internal token
is server-only and must not use a `NEXT_PUBLIC_` prefix.

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
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/migrations/008_evidence_grounded_workflows.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/migrations/009_intelligence_pipeline.sql
```

### Development commands (root)

```bash
pnpm dev          # Start the web app, API, and Python analysis worker
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

The Rust pipeline worker is a separate long-running process:

```bash
cargo run --manifest-path services/rust/Cargo.toml --bin polityra-ingestion
```

Manual and automatic analyses are durable PostgreSQL jobs. `POST /api/v1/analyses` returns
`202 Accepted` immediately; the dashboard tracks the saved analysis ID through pending, running,
completed and failed states. Leases, retries and attempt history are stored in PostgreSQL. The
worker and configured Ollama model must both be available for AI synthesis, and generated summaries
require human review.

For news sources, the API checks the supplied feed and discovers advertised same-domain RSS/Atom
feeds or common paths when necessary. Only public HTTPS hosts within the source domain are accepted.
Discovery does not crawl the site and may require a manually supplied feed URL.

## Architecture overview

1. **User** → interacts with the Next.js frontend (`apps/web/`)
2. **Frontend** → uses the shared API client (`packages/api-client/`)
3. **API Client** → communicates with the Express backend (`apps/api/`)
4. **Express Backend** → validates requests, checks auth/permissions, accesses PostgreSQL
5. **Rust Pipeline Worker** → claims durable jobs, ingests/normalizes sources and orchestrates
   extraction, verification and report generation
6. **Python Analysis Service** → handles computational analysis, typed extraction and evidence
   matching
7. **Dashboard** → provides Analysis History, detail pages and a Human Review queue with source
   provenance

## AI models and providers

Open Polityra is built around **open-weight models** and does not depend on any single vendor.

- **Today:** models run through a local or self-hosted [Ollama](https://ollama.com) instance
  (default `olmo-3:7b`, see [Getting started](#setup)). Model governance is described in
  [MODEL_POLICY.md](MODEL_POLICY.md).
- **Planned:** a provider adapter for OpenAI-compatible APIs, so the project can run larger
  open-weight models on hosted infrastructure without code changes beyond configuration. Progress
  is tracked in [ROADMAP.md](ROADMAP.md).
- **Provider requirements:** the project only sends **public data** to model providers. No personal
  data, credentials, or non-public sensitive information are used (see
  [DATA_POLICY.md](DATA_POLICY.md) and [PRIVACY.md](PRIVACY.md)). Providers with EU hosting and
  zero data retention are preferred.
- **Independence:** providers and sponsors have no influence over analysis outputs, source
  selection, or evaluation results (see [SPONSORS.md](SPONSORS.md)).

The project is currently unfunded and relies on free tiers and in-kind support. If you operate an
AI service or cloud platform and would like to support open, public-interest analysis tooling, see
[SPONSORS.md](SPONSORS.md).

## Development principles

1. **Evidence before narrative:** material claims should link to traceable sources.
2. **Human accountability:** outputs inform people; they do not make public decisions.
3. **Plurality:** show competing explanations and policy options fairly.
4. **Uncertainty:** distinguish observations, estimates, assumptions, and scenarios.
5. **Privacy and minimisation:** collect only data necessary for a defined purpose.
6. **Security by design:** use public data by default and protect credentials.
7. **Reproducibility:** version data snapshots, methods, model configurations, and results.
8. **Independent evaluation:** measure factuality, calibration, robustness, and bias.

## Get involved

Open Polityra needs more than code. You can help with:

- **Software engineering:** TypeScript (Next.js, Express), Python, Rust, PostgreSQL.
- **Research:** methods, scenario design, domain studies in economics, security and energy.
- **Data:** cataloguing and validating public data sources.
- **Evaluation:** benchmarks, backtesting, calibration and bias review.
- **Documentation and translation.**
- **Infrastructure support:** AI inference capacity, hosting, GPU time (see
  [SPONSORS.md](SPONSORS.md)).

Good first steps:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md),
   [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md).
2. Browse [open issues](https://github.com/Polityra/Open-Polityra/issues) or start a thread in
   [Discussions](https://github.com/Polityra/Open-Polityra/discussions).
3. Introduce yourself in the community chat (see below) and tell us what you would like to work on.

For research contributions, include methodology, assumptions, sources, limitations, and
reproducibility information. For code contributions, include tests and update relevant
documentation.

## Community and communication

| Purpose                                  | Channel                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Questions, ideas, proposals              | [GitHub Discussions](https://github.com/Polityra/Open-Polityra/discussions)                |
| Bugs and feature requests                | [GitHub Issues](https://github.com/Polityra/Open-Polityra/issues)                          |
| Day-to-day contributor chat              | Community chat: https://dsc.gg/polityra                                           |
| Sponsors, partners and press             | 
openpolityra@gmail.com                                                             |
| Security vulnerabilities (private)       | See [SECURITY.md](SECURITY.md). Never report vulnerabilities in public issues.            |

Community roles (maintainer, moderator, contributor, observer) are described in
[GOVERNANCE.md](GOVERNANCE.md). All spaces follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Sponsors and supporters

Open Polityra is currently unfunded and depends on in-kind support, mainly AI inference capacity and
compute, from organisations that share our goals. See [SPONSORS.md](SPONSORS.md) for what we need,
what we offer in return, and how to get in touch.

Current supporters are listed in [SPONSORS.md](SPONSORS.md#current-supporters).

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

To cite this project, see [CITATION.cff](CITATION.cff).

## Disclaimer

This project is provided for research, education, and decision-support development. It is provided
without warranty. Outputs may be incomplete, incorrect, outdated, or misleading. Users must
independently verify information and consult qualified experts before relying on it.

## Contact

- General questions: [GitHub Discussions](https://github.com/Polityra/Open-Polityra/discussions)
- Sponsorship, partnerships and press: 
openpolityra@gmail.com
- Security: [SECURITY.md](SECURITY.md)

Never disclose vulnerabilities, personal data, credentials, or confidential information in public
issues or discussions.
