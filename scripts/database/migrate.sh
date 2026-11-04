
#!/bin/bash
# Open Polityra - Database Migration Script
# Applies pending database migrations in order.

set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://postgres:1687@localhost:5432/open_polityra}"

# Resolve project root independently of the current working directory.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

MIGRATION_DIR="$PROJECT_ROOT/packages/database/migrations"

echo "=== Open Polityra: Database Migration ==="
echo "Project root: $PROJECT_ROOT"
echo "Migration directory: $MIGRATION_DIR"

# Verify migration directory exists.
if [[ ! -d "$MIGRATION_DIR" ]]; then
    echo "[ERROR] Migration directory not found: $MIGRATION_DIR"
    exit 1
fi

# Find SQL migration files.
shopt -s nullglob
MIGRATIONS=("$MIGRATION_DIR"/*.sql)

if [[ ${#MIGRATIONS[@]} -eq 0 ]]; then
    echo "[INFO] No migration files found."
    exit 0
fi

# Sort migrations by filename.
IFS=$'\n' MIGRATIONS=($(printf '%s\n' "${MIGRATIONS[@]}" | sort))
unset IFS

echo ""
echo "Available migrations:"

for migration in "${MIGRATIONS[@]}"; do
    echo "  $(basename "$migration")"
done

# Apply migrations in order.
for migration_file in "${MIGRATIONS[@]}"; do
    filename="$(basename "$migration_file")"

    echo ""
    echo "Applying: $filename ..."

    if psql "$DB_URL" \
        -v ON_ERROR_STOP=1 \
        -f "$migration_file"; then
        echo "[OK] $filename applied."
    else
        echo "[ERROR] Failed to apply $filename."
        exit 1
    fi
done

echo ""
echo "=== Database migrations complete ==="
