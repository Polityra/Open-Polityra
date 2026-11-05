"""Abstract data ingestion interface.

Concrete ingestors implement this protocol to normalise and validate
data from various sources (APIs, files, databases) before it enters the
analysis pipeline.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import UTC, datetime
from typing import Any

from src.common.errors import ValidationError


class DataIngestor(ABC):
    """Base class for all data ingestors."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of this ingestor (e.g. ``'csv-file'``, ``'rest-api'``)."""

    @abstractmethod
    async def fetch(self, **params: Any) -> list[list[float]]:
        """Retrieve raw data from the source.

        Returns a 2-D list where each inner list represents one row of numeric observations.

        Raises:
            DataSourceError: If the source is unreachable or returns an unexpected status.
        """

    @abstractmethod
    def normalize(
        self,
        raw: list[list[float]],
        **kwargs: Any,
    ) -> list[list[float]]:
        """Normalise *raw* data (e.g. handle NaN, align columns).

        Args:
            raw: Unprocessed data rows returned from :meth:`fetch`.
            **kwargs: Normalisation parameters (column_mapping, fill_strategy, etc.).

        Returns:
            A 2-D list of valid floats.

        Raises:
            ValidationError: If the data cannot be normalised.
        """

    @abstractmethod
    def validate(
        self,
        data: list[list[float]],
        min_rows: int = 1,
        min_cols: int = 1,
    ) -> bool:
        """Validate that *data* meets the ingestor's requirements.

        Args:
            data: Data to validate.
            min_rows: Minimum number of rows expected.
            min_cols: Minimum number of columns per row.

        Returns:
            ``True`` if valid.

        Raises:
            ValidationError: If validation fails (also raises for invalid input).
        """

    async def ingest(
        self,
        **params: Any,
    ) -> tuple[list[list[float]], dict[str, Any]]:
        """Convenience method: fetch → validate → normalise.

        Returns a tuple of (normalised_data, ingestion_metadata).
        """
        raw = await self.fetch(**params)
        if not self.validate(raw):
            raise ValidationError(
                message=f"Ingestor '{self.name}' validation failed on fetched data",
                details={"source": self.name},
            )
        normalised = self.normalize(raw)
        metadata: dict[str, Any] = {
            "ingestor": self.name,
            "rows": len(normalised),
            "cols": len(normalised[0]) if normalised else 0,
            "timestamp": datetime.now(UTC).isoformat(),
        }
        return normalised, metadata
