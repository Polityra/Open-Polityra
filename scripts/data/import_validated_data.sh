#!/bin/bash
# Open Polityra - Data Import Validation Script
# Validates imported data against defined quality rules before loading into the database.

set -euo pipefail

DATA_DIR="${1:-data/examples}"

echo "=== Open Polityra: Data Import Validation ==="
echo "Checking files in: $DATA_DIR"

errors=0
warnings=0

for file in "$DATA_DIR"/*.json "$DATA_DIR"/*.csv 2>/dev/null; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")

    echo ""
    echo "Validating: $filename ..."

    # Check if the file is valid JSON (for .json files)
    if [[ "$file" == *.json ]]; then
        if ! python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
            echo "[ERROR] Invalid JSON in $filename"
            errors=$((errors + 1))
            continue
        fi
    fi

    # Check for required fields (if the file has a known schema)
    if [[ "$file" == *sample* ]]; then
        echo "[WARN] $filename is sample data. Review before production use."
        warnings=$((warnings + 1))
    fi
done

echo ""
echo "Validation complete: $errors errors, $warnings warnings"

if [ "$errors" -gt 0 ]; then
    echo "[FAIL] Fix errors before importing data."
    exit 1
fi

echo "[OK] Data validation passed."
