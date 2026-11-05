"""Structured logging with JSON formatter for the analysis worker."""

from __future__ import annotations

import json
import logging
import sys
import time
from datetime import UTC, datetime
from typing import Any, Self


class JSONFormatter(logging.Formatter):
    """Format log records as structured JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        extra_fields = {}
        if hasattr(record, "extra_fields"):  # type: ignore[attr-defined]
            extra_fields = getattr(record, "extra_fields", {})  # type: ignore[attr-defined]

        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            **extra_fields,
        }

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)  # type: ignore[arg-type]

        return json.dumps(log_entry)


def _create_logger(
    name: str,
    level: int = logging.INFO,
    handlers: list[logging.Handler] | None = None,
) -> logging.Logger:
    """Internal helper to create a configured logger."""
    logger = logging.getLogger(name)

    if not handlers:
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(JSONFormatter())
        handlers = [stream_handler]

    for handler in handlers:
        logger.addHandler(handler)

    logger.setLevel(level)
    return logger


# Module-level factory so callers don't need to configure from scratch.
def get_logger(
    name: str | None = None,
    level: int = logging.INFO,
) -> logging.Logger:
    """Create or retrieve a structured JSON logger.

    Args:
        name: Logger name (defaults to *analysis-worker*).
        level: Logging level (default INFO).

    Returns:
        A configured :class:`logging.Logger` with JSON formatting.
    """
    base_name = name or "analysis-worker"
    return _create_logger(base_name, level)


def log_with_extra(
    logger: logging.Logger,
    level: int,
    message: str,
    extra: dict[str, Any] | None = None,
) -> None:
    """Log a message with additional structured fields.

    Args:
        logger: Target logger instance.
        level: Logging level constant.
        message: Log message.
        extra: Key-value pairs merged into the JSON log entry.
    """
    record = logger.makeRecord(  # type: ignore[attr-defined]
        logger.name, level, "(none)", 0, message, (), None
    )
    if extra:
        record.extra_fields = extra  # type: ignore[attr-defined]
        for key, value in extra.items():
            setattr(record, key, value)  # type: ignore[attr-defined]
    logger.handle(record)


def with_timing(logger: logging.Logger, label: str):
    """Context manager that logs elapsed time under *label*.

    Usage::

        with with_timing(logger, "fetch"):
            data = fetch_data()

    Returns the context manager object.
    """

    class _Timing:
        def __enter__(self) -> Self:
            self._start = time.perf_counter()
            return self

        def __exit__(self, *args: object) -> None:
            elapsed = time.perf_counter() - self._start
            log_with_extra(
                logger,
                logging.DEBUG,
                f"{label} completed in {elapsed:.3f}s",
                {"label": label, "elapsed_seconds": elapsed},
            )

    return _Timing()
