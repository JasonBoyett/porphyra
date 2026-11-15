from uuid import UUID

from pydantic import Field

from app.schemas.base import ApiModel


class SyncableApiModel(ApiModel):
    """API response with an internal, serialization-excluded sync audience."""

    sync_recipient_ids: list[UUID] = Field(exclude=True, repr=False)

    def publish_sync_to(self) -> list[UUID]:
        return list(self.sync_recipient_ids)
