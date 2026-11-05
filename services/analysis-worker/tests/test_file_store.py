from pathlib import Path

from src.api.schemas.analysis import DataScope
from src.data.storage.local_store import FileStore


def test_get_matches_topic_metadata_without_using_topic_as_a_path_pattern(tmp_path: Path) -> None:
    store = FileStore(str(tmp_path))
    stored_path = store.put("../../outside", DataScope.TOPIC, [[1.0]])

    found_path = store.get("../../outside", DataScope.TOPIC)

    assert found_path == stored_path
    assert found_path is not None
    assert found_path.parent == tmp_path
