"""Time-series analysis functions.

SAMPLE / PLACEHOLDER:

These implementations are intentionally lightweight reference algorithms.
For production use in the political domain, replace with domain-specific
models (SARIMAX, Prophet, etc.) while preserving this module's interface.
"""

from __future__ import annotations

import numpy as np
from scipy import signal  # noqa: N814


def rolling_mean(data: list[float], window: int) -> list[float]:
    """Compute a simple rolling (moving) mean.

    Args:
        data: Input time-series values.
        window: Size of the rolling window.

    Returns:
        A list of the same length as *data* where each element is the
        mean of the trailing *window* observations (``NaN``-padded at the start).
    """
    if window < 1 or window > len(data):
        raise ValueError(f"window must be in [1, {len(data)}], got {window}")

    arr = np.asarray(data, dtype=np.float64)
    kernel = np.ones(window) / window
    result = np.convolve(arr, kernel, mode="same")
    return result.tolist()


def exponential_smoothing(
    data: list[float], alpha: float = 0.3,
) -> list[float]:
    """Apply simple exponential smoothing (SES).

    The smoothed value at index *t* is::

        S[t] = alpha * x[t] + (1 - alpha) * S[t-1]

    Args:
        data: Input time-series values.
        alpha: Smoothing factor in (0, 1). Higher = more responsive to recent data.

    Returns:
        List of smoothed values the same length as *data*.
    """
    if not (0 < alpha < 1):
        raise ValueError(f"alpha must be in (0, 1), got {alpha}")
    if len(data) == 0:
        return []

    arr = np.asarray(data, dtype=np.float64)
    smoothed = np.empty_like(arr)
    smoothed[0] = arr[0]
    for i in range(1, len(arr)):
        smoothed[i] = alpha * arr[i] + (1 - alpha) * smoothed[i - 1]
    return smoothed.tolist()


def detect_trend(data: list[float]) -> dict[str, float]:
    """Detect linear trend using least-squares regression.

    Returns a dict with:
        - ``slope``: Estimated slope per period.
        - ``direction``: One of ``"increasing"``, ``"decreasing"``, or ``"stable"``.
        - ``r_squared``: Coefficient of determination.
    """
    if len(data) < 2:
        return {"slope": 0.0, "direction": "insufficient-data", "r_squared": 0.0}

    arr = np.asarray(data, dtype=np.float64)
    x = np.arange(len(arr), dtype=np.float64)
    # Use scipy.signal.lfilter as a lightweight alternative for trend estimation
    coeffs, _, _ = np.linalg.lstsq(x[:, None], arr, rcond=None)  # type: ignore[arg-type]
    slope = float(coeffs[0])

    # R² calculation
    predictions = slope * x + (arr.mean() - slope * x.mean())
    ss_res = np.sum((arr - predictions) ** 2)
    ss_tot = np.sum((arr - arr.mean()) ** 2)
    r_squared = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0

    if abs(slope) < 0.001:
        direction = "stable"
    elif slope > 0:
        direction = "increasing"
    else:
        direction = "decreasing"

    return {
        "slope": round(slope, 6),
        "direction": direction,
        "r_squared": round(r_squared, 4),
    }


def holt_winters(
    data: list[float],
    alpha: float = 0.3,
    beta: float = 0.1,
    gamma: float = 0.1,
    period: int = 7,
) -> list[float]:
    """Apply Holt-Winters exponential smoothing with trend and seasonality.

    SAMPLE / PLACEHOLDER: This is a simplified single-season implementation.
    For production use, consider :func:`statsmodels.tsa.holtwinters.ExponentialSmoothing`.

    Args:
        data: Input time-series (must have length >= period).
        alpha: Level smoothing factor (0, 1).
        beta: Trend smoothing factor (0, 1).
        gamma: Seasonal smoothing factor (0, 1).
        period: Length of the seasonal cycle.

    Returns:
        List of fitted (smoothed) values the same length as *data*.
    """
    if len(data) < period + 2:
        raise ValueError(f"data length must be at least {period + 2}")

    n = len(data)
    level = np.zeros(n)
    trend = np.zeros(n)
    seasonal = np.zeros(n)

    # Initialisation
    first_season = np.mean(data[:period])
    for i in range(period):
        seasonal[i] = data[i] - first_season
    level[0] = first_season
    trend[0] = (data[min(period, n-1)] - data[0]) / min(period, n-1)

    for t in range(1, n):
        s_idx = t % period
        level[t] = alpha * (data[t] - seasonal[s_idx]) + (1 - alpha) * (level[t-1] + trend[t-1])
        trend[t] = beta * (level[t] - level[t-1]) + (1 - beta) * trend[t-1]
        seasonal[t] = gamma * (data[t] - level[t]) + (1 - gamma) * seasonal[s_idx]

    return (level + trend + seasonal).tolist()
