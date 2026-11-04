#!/bin/bash
# Open Polityra - Release Checklist Script
# This script verifies that all requirements are met before a release.

set -euo pipefail

echo "=== Open Polityra: Pre-Release Checklist ==="

# 1. Type checking
echo "[1/6] Running TypeScript type check..."
pnpm typecheck || { echo "FAIL: TypeScript type errors detected"; exit 1; }
echo "[OK] Type check passed."

# 2. Linting
echo "[2/6] Running linters..."
pnpm lint || { echo "FAIL: Linting errors detected"; exit 1; }
echo "[OK] Linting passed."

# 3. Formatting
echo "[3/6] Checking formatting..."
pnpm format:check || { echo "FAIL: Formatting issues detected"; exit 1; }
echo "[OK] Formatting passed."

# 4. Testing
echo "[4/6] Running tests..."
pnpm test || { echo "FAIL: Test failures detected"; exit 1; }
echo "[OK] Tests passed."

# 5. Build
echo "[5/6] Building all packages..."
pnpm build || { echo "FAIL: Build errors detected"; exit 1; }
echo "[OK] Build succeeded."

# 6. Documentation
echo "[6/6] Validating documentation..."
if [ ! -f CHANGELOG.md ]; then echo "WARN: CHANGELOG.md not found."; fi
if [ -d docs/architecture ] && [ "$(ls docs/architecture/*.md 2>/dev/null | wc -l)" -lt 4 ]; then
    echo "WARN: Some architecture docs are missing."
fi
echo "[OK] Documentation check complete."

echo ""
echo "=== Release checklist PASSED ==="
echo "Proceed with creating the git tag and release on GitHub."
