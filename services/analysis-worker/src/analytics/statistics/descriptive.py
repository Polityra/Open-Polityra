"""Descriptive statistics functions for the analysis engine.

All functions accept a ``Sequence[float]`` and return typed results.
Uses :mod:`numpy` and :mod:`scipy` under the hood.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np
from scipy import stats as sp_stats


def describe(data: Sequence[float]) -> dict[str, float | None]:
    """Compute a full suite of descriptive statistics.

    Args:
        data: Numeric observations (must contain at least one value).

    Returns:
        Dictionary with keys: ``mean``, ``median``, ``std``, ``min``, ``max``,
        ``skewness``, ``kurtosis``, ``variance``, ``range``, and ``iqr``.

    Raises:
        ValueError: If *data* is empty.
    """
    arr = np.asarray(data, dtype=np.float64)
    if arr.size == 0:
        raise ValueError("descriptive statistics require at least one observation")

    q25, q75 = np.percentile(arr, [25, 75])
    iqr = float(q75 - q25)

    return {
        "mean": float(np.mean(arr)),
        "median": float(np.median(arr)),
        "std": float(np.std(arr, ddof=1)) if arr.size > 1 else None,
        "variance": float(np.var(arr, ddof=1)) if arr.size > 1 else None,
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "range": float(np.max(arr) - np.min(arr)),
        "skewness": float(sp_stats.skew(arr)) if np.ptp(arr) > 0 else None,
        "kurtosis": float(sp_stats.kurtosis(arr)) if np.ptp(arr) > 0 else None,
        "iqr": iqr,
    }


def mean(data: Sequence[float]) -> float:
    """Arithmetic mean of *data*."""
    arr = np.asarray(data, dtype=np.float64)
    return float(np.mean(arr))


def median(data: Sequence[float]) -> float:
    """Median (50th percentile) of *data*."""
    arr = np.asarray(data, dtype=np.float64)
    return float(np.median(arr))


def std_dev(data: Sequence[float], ddof: int = 1) -> float:
    """Sample standard deviation.

    Args:
        data: Numeric observations.
        ddof: Delta degrees of freedom (default 1 for sample std).
    """
    arr = np.asarray(data, dtype=np.float64)
    return float(np.std(arr, ddof=ddof))


def percentile(data: Sequence[float], q: float) -> float:
    """*q*-th percentile of *data*.

    Args:
        data: Numeric observations.
        q: Percentile in the range [0, 100].

    Raises:
        ValueError: If *q* is outside [0, 100].
    """
    if not 0 <= q <= 100:
        raise ValueError(f"percentile q must be in [0, 100], got {q}")
    arr = np.asarray(data, dtype=np.float64)
    return float(np.percentile(arr, q))


def skewness(data: Sequence[float]) -> float:
    """Fisher-Pearson coefficient of skewness.

    Returns a positive value for right-skewed data and negative for left-skewed.
    """
    arr = np.asarray(data, dtype=np.float64)
    return float(sp_stats.skew(arr))


def kurtosis_excess(data: Sequence[float]) -> float:
    """Excess kurtosis (Fisher definition; normal distribution = 0)."""
    arr = np.asarray(data, dtype=np.float64)
    return float(sp_stats.kurtosis(arr))


def iqr(data: Sequence[float]) -> float:
    """Inter-quartile range (75th - 25th percentile)."""
    q1 = percentile(data, 25)
    q3 = percentile(data, 75)
    return q3 - q1


def normality_test(data: Sequence[float]) -> dict[str, float]:
    """Shapiro-Wilk test for normality.

    Returns a dict with *statistic* and *p_value*.

    Interpretation:
        p_value > 0.05 suggests the data is consistent with a normal distribution.
    """
    arr = np.asarray(data, dtype=np.float64)
    if arr.size < 3:
        raise ValueError("Shapiro-Wilk test requires at least 3 observations")
    stat, p_value = sp_stats.shapiro(arr)
    return {"statistic": float(stat), "p_value": float(p_value)}


def correlation_matrix(data: Sequence[Sequence[float]]) -> list[list[float]]:
    """Compute the Pearson correlation matrix for tabular data.

    Args:
        data: A 2-D sequence where each inner sequence is a column/variable.

    Returns:
        Square symmetric matrix of correlation coefficients.
    """
    arr = np.asarray(data, dtype=np.float64)
    if arr.ndim != 2:
        raise ValueError("data must be 2-dimensional")
    corr = np.corrcoef(arr, rowvar=False)
    return [[float(corr[i, j]) for j in range(corr.shape[1])] for i in range(corr.shape[0])]
