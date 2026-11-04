#!/bin/bash
# Open Polityra - Repository Initialization Script
# Sets up the development environment for the monorepo.

set -euo pipefail

echo "=== Open Polityra: Initializing Development Environment ==="

# Step 1: Node.js setup
if command -v node &>/dev/null && command -v pnpm &>/dev/null; then
    echo "[OK] Node.js and pnpm are installed."
else
    echo "[WARN] Node.js 22+ and pnpm 10 are required. Install them first:"
    echo "  https://nodejs.org/"
    echo "  https://pnpm.io/installation"
fi

# Step 2: Install dependencies
echo ""
echo "Installing npm dependencies..."
pnpm install --frozen-lockfile || {
    echo "[WARN] pnpm install failed. Check for missing or conflicting packages."
    exit 1
}
echo "[OK] Dependencies installed."

# Step 3: Copy environment files
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[INFO] Created .env from .env.example. Update with your configuration."
fi

# Step 4: Python service setup
if [ -f services/analysis-worker/pyproject.toml ]; then
    echo ""
    echo "Python analysis service detected. To set up the Python environment:"
    echo "  cd services/analysis-worker"
    echo "  python3 -m venv .venv"
    echo "  source .venv/bin/activate  # Windows: .venv\\Scripts\\activate"
    echo "  pip install -e '.[dev]'"
fi

# Step 5: Database setup
echo ""
echo "Database setup:"
echo "  Option A: Use Docker Compose from infra/local/postgres/"
echo "    cd infra/local/postgres && docker compose up -d"
echo "  Option B: Install PostgreSQL 16+ locally and run migrations manually:"
echo "    psql -U postgres -f packages/database/migrations/001_init.sql"

echo ""
echo "=== Initialization complete ==="
echo "Next steps:"
echo "  Run all services:     pnpm dev"
echo "  Start frontend only:  cd apps/web && pnpm dev"
echo "  Start backend only:   cd apps/api && pnpm dev"
