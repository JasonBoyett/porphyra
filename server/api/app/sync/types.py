from typing import Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class SyncPublishable(Protocol):
    """A response that owns the audience allowed to receive its stale signal."""

    def publish_sync_to(self) -> list[UUID]: ...
