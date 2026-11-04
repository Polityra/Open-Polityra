#!/usr/bin/env python3
"""Refresh or validate the dated Finland fiscal data snapshot from Eurostat."""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "data/examples/finland_fiscal_balance.json"
BASE_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/gov_10dd_edpt1"
SERIES = {
    "balance_pct_gdp": {
        "na_item": "B9",
        "label": "Net lending (+) / net borrowing (-)",
    },
    "debt_pct_gdp": {
        "na_item": "GD",
        "label": "Government consolidated gross debt",
    },
}


class ImportErrorDetail(ValueError):
    """Raised when source data fails its expected schema or quality checks."""


def _finite_number(value: Any, field: str, year: int) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ImportErrorDetail(f"{field} for {year} must be numeric")
    if not math.isfinite(value):
        raise ImportErrorDetail(f"{field} for {year} must be finite")
    return float(value)


def validate_snapshot(snapshot: Any) -> dict[str, Any]:
    if not isinstance(snapshot, dict):
        raise ImportErrorDetail("snapshot must be a JSON object")
    if snapshot.get("dataset") != "finland_general_government_fiscal_balance":
        raise ImportErrorDetail("unexpected or missing dataset identifier")

    source = snapshot.get("source")
    if not isinstance(source, dict):
        raise ImportErrorDetail("source metadata is required")
    expected_source = {
        "publisher": "Eurostat",
        "dataset_id": "gov_10dd_edpt1",
        "geography": "FI",
        "frequency": "Annual",
        "unit": "Percent of GDP",
        "sector": "General government (S13)",
    }
    for field, expected in expected_source.items():
        if source.get(field) != expected:
            raise ImportErrorDetail(f"source.{field} must be {expected!r}")
    for field in ("url", "license", "license_url", "retrieved_at", "last_updated"):
        if not isinstance(source.get(field), str) or not source[field].strip():
            raise ImportErrorDetail(f"source.{field} is required")

    try:
        date.fromisoformat(source["retrieved_at"])
        datetime.fromisoformat(source["last_updated"])
    except ValueError as exc:
        raise ImportErrorDetail(f"invalid source date metadata: {exc}") from exc

    indicators = snapshot.get("indicators")
    if not isinstance(indicators, dict):
        raise ImportErrorDetail("indicator metadata is required")
    balance_indicator = indicators.get("balance_pct_gdp")
    debt_indicator = indicators.get("debt_pct_gdp")
    if not isinstance(balance_indicator, dict) or balance_indicator.get("code") != "B9":
        raise ImportErrorDetail("balance indicator must be Eurostat B9")
    if not isinstance(debt_indicator, dict) or debt_indicator.get("code") != "GD":
        raise ImportErrorDetail("debt indicator must be Eurostat GD")

    observations = snapshot.get("observations")
    if not isinstance(observations, list) or len(observations) < 2:
        raise ImportErrorDetail("at least two annual observations are required")

    previous_year = 0
    for row in observations:
        if not isinstance(row, dict):
            raise ImportErrorDetail("each observation must be an object")
        year = row.get("year")
        if isinstance(year, bool) or not isinstance(year, int):
            raise ImportErrorDetail("observation year must be an integer")
        if year <= previous_year:
            raise ImportErrorDetail("observation years must be unique and ascending")
        previous_year = year
        row["balance_pct_gdp"] = _finite_number(row.get("balance_pct_gdp"), "balance_pct_gdp", year)
        row["debt_pct_gdp"] = _finite_number(row.get("debt_pct_gdp"), "debt_pct_gdp", year)
        if row["debt_pct_gdp"] < 0:
            raise ImportErrorDetail(f"debt_pct_gdp for {year} cannot be negative")

    limitations = snapshot.get("limitations")
    if not isinstance(limitations, list) or not limitations or any(not isinstance(item, str) or not item.strip() for item in limitations):
        raise ImportErrorDetail("documented limitations are required")
    return snapshot


def _fetch_series(na_item: str, start_year: int) -> tuple[dict[int, float], str]:
    params = {
        "freq": "A",
        "unit": "PC_GDP",
        "sector": "S13",
        "na_item": na_item,
        "geo": "FI",
        "sinceTimePeriod": str(start_year),
        "lang": "en",
    }
    request = Request(
        f"{BASE_URL}?{urlencode(params)}",
        headers={"Accept": "application/json", "User-Agent": "OpenPolityra-data-import/1.0"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            payload = json.load(response)
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ImportErrorDetail(f"Eurostat request for {na_item} failed: {exc}") from exc

    if not isinstance(payload, dict):
        raise ImportErrorDetail(f"Eurostat response for {na_item} must be a JSON object")
    extension = payload.get("extension")
    if not isinstance(extension, dict) or extension.get("id") != "GOV_10DD_EDPT1":
        raise ImportErrorDetail(f"Eurostat returned an unexpected dataset for {na_item}")
    dimension = payload.get("dimension")
    time = dimension.get("time") if isinstance(dimension, dict) else None
    category = time.get("category") if isinstance(time, dict) else None
    time_dimension = category.get("index") if isinstance(category, dict) else None
    values = payload.get("value")
    if not isinstance(time_dimension, dict) or not isinstance(values, dict):
        raise ImportErrorDetail(f"Eurostat response for {na_item} is missing time/value dimensions")
    observations: dict[int, float] = {}
    for year_text, position in time_dimension.items():
        value = values.get(str(position))
        if value is None:
            continue
        try:
            year = int(year_text)
        except ValueError as exc:
            raise ImportErrorDetail(f"Eurostat returned invalid year {year_text!r}") from exc
        observations[year] = _finite_number(value, na_item, year)
    last_updated = payload.get("updated")
    if not isinstance(last_updated, str):
        raise ImportErrorDetail(f"Eurostat response for {na_item} has no update timestamp")
    return observations, last_updated


def fetch_snapshot(start_year: int = 2000) -> dict[str, Any]:
    all_series = {
        key: _fetch_series(definition["na_item"], start_year)
        for key, definition in SERIES.items()
    }
    years = sorted(set.intersection(*(set(data) for data, _ in all_series.values())))
    if len(years) < 2:
        raise ImportErrorDetail("Eurostat returned fewer than two years with both fiscal indicators")

    observations = [
        {
            "year": year,
            "balance_pct_gdp": all_series["balance_pct_gdp"][0][year],
            "debt_pct_gdp": all_series["debt_pct_gdp"][0][year],
        }
        for year in years
    ]
    updated = max(timestamp for _, timestamp in all_series.values())
    snapshot = {
        "dataset": "finland_general_government_fiscal_balance",
        "title": "Finland: general government net lending and consolidated gross debt",
        "source": {
            "publisher": "Eurostat",
            "dataset_id": "gov_10dd_edpt1",
            "url": BASE_URL,
            "license": "Reuse subject to Eurostat's copyright and reuse policy; attribution required.",
            "license_url": "https://ec.europa.eu/eurostat/about-us/policies/copyright",
            "geography": "FI",
            "frequency": "Annual",
            "unit": "Percent of GDP",
            "sector": "General government (S13)",
            "retrieved_at": datetime.now(timezone.utc).date().isoformat(),
            "last_updated": datetime.fromisoformat(updated.replace("Z", "+00:00")).isoformat(),
        },
        "indicators": {
            "balance_pct_gdp": {
                "code": "B9",
                "label": SERIES["balance_pct_gdp"]["label"],
                "interpretation": "A negative value indicates net borrowing (a deficit); a positive value indicates net lending (a surplus).",
            },
            "debt_pct_gdp": {
                "code": "GD",
                "label": SERIES["debt_pct_gdp"]["label"],
            },
        },
        "observations": observations,
        "limitations": [
            "Annual Eurostat observations can be revised after publication; this file is a dated snapshot.",
            "Net lending/borrowing and debt-to-GDP are observed statistics, not policy recommendations.",
            "The prototype's debt scenarios are simplified calculations and omit stock-flow adjustments and other national-accounting effects.",
        ],
    }
    return validate_snapshot(snapshot)


def write_snapshot(snapshot: dict[str, Any], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=f".{output.name}.", dir=output.parent, text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(snapshot, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        os.replace(temporary_name, output)
    except OSError:
        Path(temporary_name).unlink(missing_ok=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="snapshot JSON path")
    parser.add_argument("--refresh", action="store_true", help="fetch the latest observations from Eurostat before writing")
    args = parser.parse_args()

    if args.refresh:
        snapshot = fetch_snapshot()
        write_snapshot(snapshot, args.output)
        print(f"Refreshed {len(snapshot['observations'])} observations from Eurostat: {args.output}")
    else:
        with args.output.open(encoding="utf-8") as handle:
            snapshot = validate_snapshot(json.load(handle))
        print(f"Validated {len(snapshot['observations'])} observations: {args.output}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ImportErrorDetail, OSError, json.JSONDecodeError) as exc:
        print(f"Fiscal data import failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
