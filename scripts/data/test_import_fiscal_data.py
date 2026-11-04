"""Tests for the checked-in Eurostat fiscal snapshot and importer validation."""

from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from scripts.data.import_fiscal_data import ImportErrorDetail, validate_snapshot


SNAPSHOT = Path(__file__).resolve().parents[2] / "data/examples/finland_fiscal_balance.json"


class FiscalSnapshotValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))

    def test_checked_in_snapshot_is_valid(self) -> None:
        result = validate_snapshot(copy.deepcopy(self.snapshot))
        self.assertEqual(len(result["observations"]), 26)
        self.assertEqual(result["observations"][-1]["year"], 2025)

    def test_rejects_missing_indicator_metadata(self) -> None:
        self.snapshot["indicators"]["balance_pct_gdp"] = None
        with self.assertRaises(ImportErrorDetail):
            validate_snapshot(self.snapshot)

    def test_rejects_missing_observation_value(self) -> None:
        del self.snapshot["observations"][0]["balance_pct_gdp"]
        with self.assertRaises(ImportErrorDetail):
            validate_snapshot(self.snapshot)

    def test_rejects_duplicate_or_nonascending_years(self) -> None:
        self.snapshot["observations"][1]["year"] = self.snapshot["observations"][0]["year"]
        with self.assertRaisesRegex(ImportErrorDetail, "unique and ascending"):
            validate_snapshot(self.snapshot)

    def test_rejects_nonfinite_values_and_negative_debt(self) -> None:
        self.snapshot["observations"][0]["balance_pct_gdp"] = float("nan")
        with self.assertRaisesRegex(ImportErrorDetail, "finite"):
            validate_snapshot(self.snapshot)

        self.snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        self.snapshot["observations"][0]["debt_pct_gdp"] = -1
        with self.assertRaisesRegex(ImportErrorDetail, "cannot be negative"):
            validate_snapshot(self.snapshot)


if __name__ == "__main__":
    unittest.main()
