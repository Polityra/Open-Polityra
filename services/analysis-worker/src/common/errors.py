"""Custom exception classes for the analysis worker service."""

from __future__ import annotations

from http import HTTPStatus
from typing import Any


class AnalysisError(Exception):
    """Base exception for analysis-related errors."""

    def __init__(
        self,
        message: str = "An analysis error occurred",
        code: int = HTTPStatus.INTERNAL_SERVER_ERROR,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": self.__class__.__name__,
            "message": str(self),
            "code": self.code,
            **self.details,
        }


class ValidationError(AnalysisError):
    """Raised when input validation fails."""

    def __init__(
        self,
        message: str = "Input validation failed",
        code: int = HTTPStatus.BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code, details)


class ModelUnavailableError(AnalysisError):
    """Raised when an AI model is not available."""

    def __init__(
        self,
        message: str = "AI model unavailable",
        code: int = HTTPStatus.SERVICE_UNAVAILABLE,
        provider: str = "",
        details: dict[str, Any] | None = None,
    ) -> None:
        extra: dict[str, Any] = {}
        if provider:
            extra["provider"] = provider
        if details:
            extra.update(details)
        super().__init__(message, code, extra)


class DataSourceError(AnalysisError):
    """Raised when a data source is unreachable or returns invalid data."""

    def __init__(
        self,
        message: str = "Data source error",
        code: int = HTTPStatus.BAD_GATEWAY,
        source: str = "",
        details: dict[str, Any] | None = None,
    ) -> None:
        extra: dict[str, Any] = {}
        if source:
            extra["source"] = source
        if details:
            extra.update(details)
        super().__init__(message, code, extra)


class PipelineError(AnalysisError):
    """Raised when the analysis pipeline fails at any stage."""

    def __init__(
        self,
        message: str = "Pipeline execution error",
        code: int = HTTPStatus.INTERNAL_SERVER_ERROR,
        stage: str = "",
        details: dict[str, Any] | None = None,
    ) -> None:
        extra: dict[str, Any] = {}
        if stage:
            extra["stage"] = stage
        if details:
            extra.update(details)
        super().__init__(message, code, extra)
