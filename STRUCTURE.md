# Open Polityra — Repository Structure

This document lists the complete repository structure for reference.

## Root
```
open-polityra/
├── apps/                    # Application packages
│   ├── api/                 # Express API server (1,184 LOC)
│   └── web/                 # Next.js frontend (React 19 + Recharts)
├── data/                    # Data catalogues and schemas
│   ├── catalog/sources/     # Statistics Finland, Eurostat, World Bank docs
│   ├── examples/            # Sample economic data (illustrative only)
│   ├── schemas/             # JSON Schema definitions
│   └── validation/          # Quality rules
├── docs/                    # Architecture and operations docs
│   ├── architecture/        # System, backend, frontend, AI engine, data, security
│   ├── decisions/           # ADRs (architecture decision records)
│   ├── developer/           # Getting started, debugging, testing, code standards
│   ├── operations/          # Deployment, monitoring, backups, disaster recovery
│   └── product/             # Product overview, requirements, user roles
├── evaluation/              # Model evaluation framework
│   ├── benchmarks/          # Economic forecasting, geopolitical prediction
│   ├── bias-and-fairness/  # Bias monitoring and mitigation
│   ├── calibration/         # Uncibration assessment (Brier score)
│   └── factuality/         # Claim-level accuracy standards
├── infra/                   # Infrastructure configs
│   ├── containers/          # Docker Compose + Dockerfiles for all services
│   ├── local/               # Local development (Postgres, Redis)
│   └── monitoring/          # Metrics configuration
├── models/                  # AI model registry and prompt templates
│   ├── model-cards/         # Evaluation baseline cards
│   ├── prompts/             # Version-controlled prompt templates
│   └── registry/            # Model cards with capabilities and limits
├── packages/                # Shared workspace packages
│   ├── api-client/          # Typed API client for frontend
│   ├── config/              # ESLint, TypeScript, Prettier configs
│   ├── contracts/           # Zod schemas (shared backend/frontend)
│   ├── database/            # PostgreSQL migrations and seeds
│   ├── observability/       # Logging, tracing, metrics configs
│   └── ui/                  # Design tokens and shared components
├── research/                # Research domain documentation
│   ├── domains/             # 8 research domain descriptions
│   └── methodology/         # Forecasting and scenario methods
├── scripts/                 # Setup, database, data import, release scripts
├── services/                # Background services
│   └── analysis-worker/     # Python FastAPI analysis service (ABC providers)
└── tests/                   # Cross-app integration test fixtures
```

## File Counts by Section
- **Express Backend**: 23 files (1,184 lines)
- **Frontend Pages**: 17 pages
- **Python Analysis Service**: ~30 files
- **Shared Packages**: 20+ files
- **Documentation**: 50+ markdown files
- **CI Workflows**: 8 GitHub Actions workflows
