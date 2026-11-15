from typing import Protocol
from uuid import UUID


class Syncable(Protocol):
    """A response that owns the audience allowed to receive its stale signal."""

    def publish_sync_to(self) -> list[UUID]: ...
