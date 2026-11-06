"""Simple moving average and exponential weighted moving average with uncertainty estimation.

All functions return results as :class:`list[float]`.
"""

from __future__ import annotations

import numpy as np


def moving_average(data: list[float], window: int) -> list[float]:
    """Compute a simple (uniform-weight) moving average.

    For each position the output value is the mean of the trailing *window*
    observations.  Positions where fewer than *window* values are available
    receive ``NaN``.

    Args:
        data: Input time-series values.
        window: Size of the averaging window (must be >= 1).

    Returns:
        A list of :class:`float` values the same length as *data*, with
        the first ``window - 1`` entries set to ``float('nan')``.

    Raises:
        ValueError: If *window* is less than 1 or exceeds the data length.
    """
    if window < 1:
        raise ValueError(f"window must be >= 1, got {window}")
    if window > len(data):
        raise ValueError(f"window ({window}) exceeds data length ({len(data)})")

    arr = np.asarray(data, dtype=np.float64)
    cumsum = np.cumsum(arr)
    cumsum = np.insert(cumsum, 0, 0.0)
    ma = (cumsum[window:] - cumsum[:-window]) / window
    # Prepend NaN placeholders for the partial windows at the start
    nans = np.full(window - 1, np.nan)
    return list(np.concatenate([nans, ma]))


def exponential_moving_average(data: list[float], span: int) -> list[float]:
    """Compute an exponentially weighted moving average (EWMA).

    The weight for observation at index *t* relative to the current point is::

        alpha = 2 / (span + 1)
        alpha * (1 - alpha)^k   where k = number of periods back

    Unlike a simple moving average, older observations contribute less
    exponentially rather than being truncated.

    Args:
        data: Input time-series values.
        span: Half-life of the decay. Higher = smoother output.

    Returns:
        A list of float values the same length as *data* (no padding).

    Raises:
        ValueError: If *span* is less than 2 or exceeds the data length.
    """
    if span < 2:
        raise ValueError(f"span must be >= 2, got {span}")
    if span > len(data):
        raise ValueError(f"span ({span}) exceeds data length ({len(data)})")

    arr = np.asarray(data, dtype=np.float64)
    alpha = 2.0 / (span + 1)
    ema = [float(arr[0])]
    for i in range(1, len(arr)):
        ema.append(alpha * float(arr[i]) + (1 - alpha) * ema[-1])
    return ema


def moving_average_uncertainty(
    data: list[float], window: int, confidence: float = 0.95,
) -> dict[str, float]:
    """Estimate uncertainty around the last moving average value.

    Uses the residual standard error from the MA fit to construct a
    Gaussian confidence interval under the assumption of normally distributed errors.

    Args:
        data: Input time-series values.
        window: Window size for the MA computation.
        confidence: Confidence level (e.g. 0.95 for 95%).

    Returns:
        Dict with keys ``point_estimate``, ``lower_bound``, ``upper_bound``, and ``margin``.
    """
    from scipy import stats as sp_stats

    ma_vals = moving_average(data, window)
    valid_ma = [v for v in ma_vals if not np.isnan(v)]

    if len(valid_ma) < window + 1:
        raise ValueError("insufficient data for uncertainty estimation")

    residuals = [data[i] - ma_vals[i] for i in range(window, len(ma_vals)) if not np.isnan(ma_vals[i])]
    std_err = float(np.std(residuals, ddof=1)) if len(residuals) > 1 else 0.1
    point = valid_ma[-1]

    # Use t-distribution for small samples, normal for larger
    dof = max(len(residuals) - 1, 1)
    t_crit = sp_stats.t.ppf((1 + confidence) / 2, df=dof)
    margin = t_crit * std_err

    return {
        "point_estimate": float(point),
        "lower_bound": round(point - margin, 4),
        "upper_bound": round(point + margin, 4),
        "margin": round(margin, 4),
        "residual_std": round(std_err, 4),
    }
