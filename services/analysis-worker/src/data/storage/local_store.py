"""Simple file-based storage for ingested data snapshots.

All data is persisted as CSV files in a configurable directory.
Each record includes metadata (timestamp, source, scope) stored alongside
the CSV as a companion ``.meta.json`` file.
"""

from __future__ import annotations

import csv
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.api.schemas.analysis import DataScope
from src.common.logger import get_logger

logger = get_logger("analysis-worker.storage")


class FileStore:
    """Persist data snapshots as CSV files on disk.

    Args:
        base_dir: Root directory where snapshots and metadata are stored.
            Created if it does not exist.
    """

    def __init__(self, base_dir: str = "/tmp/analysis-worker-data") -> None:
        self._base = Path(base_dir)
        self._base.mkdir(parents=True, exist_ok=True)
        logger.info("file-store initialised at %s", self._base)

    # ── public API ────────────────────────────────────────────────────────────

    def put(
        self,
        topic: str,
        scope: DataScope,
        data: list[list[float]],
        metadata: dict[str, Any] | None = None,
    ) -> Path:
        """Store *data* as a CSV file and return its path.

        Args:
            topic: Identifier for the analysed topic.
            scope: Geographic/thematic scope.
            data: 2-D list of values (rows x columns).
            metadata: Optional arbitrary key-value pairs persisted as ``.meta.json``.

        Returns:
            The absolute path to the CSV file.
        """
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        safe_topic = "".join(c if c.isalnum() or c in "_-" else "_" for c in topic)
        filename = f"{safe_topic}_{scope.value}_{ts}.csv"
        filepath = self._base / filename

        with filepath.open("w", newline="") as fh:
            writer = csv.writer(fh)
            writer.writerows(data)

        meta_path = filepath.with_suffix(".meta.json")
        meta_record: dict[str, Any] = {
            "topic": topic,
            "scope": scope.value,
            "stored_at": ts,
            "rows": len(data),
            "columns": len(data[0]) if data else 0,
            **(metadata or {}),
        }
        meta_path.write_text(json.dumps(meta_record, indent=2))

        logger.info("stored %d rows to %s", len(data), filepath)
        return filepath

    def get(self, topic: str, scope: DataScope) -> Path | None:
        """Return the most recent snapshot path for *topic* and *scope*, or ``None``."""
        # Keep user-controlled topic text out of filesystem patterns. Match
        # against the metadata written alongside each snapshot instead.
        candidates: list[Path] = []
        for path in self._base.glob("*.csv"):
            metadata = self.get_metadata(path)
            if metadata and metadata.get("topic") == topic and metadata.get("scope") == scope.value:
                candidates.append(path)
        if not candidates:
            return None
        # Return the most recently modified file
        return max(candidates, key=lambda p: p.stat().st_mtime)

    def list_snapshots(self) -> list[dict[str, Any]]:
        """List all stored snapshots with their metadata."""
        results: list[dict[str, Any]] = []
        for meta_file in self._base.glob("*.meta.json"):
            try:
                meta = json.loads(meta_file.read_text())
                csv_path = meta_file.with_suffix(".csv")
                if csv_path.exists():
                    meta["file_path"] = str(csv_path)
                results.append(meta)
            except (json.JSONDecodeError, OSError):
                continue
        return sorted(results, key=lambda r: r.get("stored_at", ""), reverse=True)

    def delete(self, topic: str, scope: DataScope) -> bool:
        """Delete the most recent snapshot for *topic* and *scope*.

        Returns ``True`` if a file was removed.
        """
        path = self.get(topic, scope)
        if path is None:
            return False
        meta_path = path.with_suffix(".meta.json")
        path.unlink(missing_ok=True)
        meta_path.unlink(missing_ok=True)
        return True

    def get_metadata(self, filepath: Path) -> dict[str, Any] | None:
        """Read the metadata for a stored snapshot file."""
        meta_path = filepath.with_suffix(".meta.json")
        if not meta_path.exists():
            return None
        try:
            return json.loads(meta_path.read_text())
        except (json.JSONDecodeError, OSError):
            return None
