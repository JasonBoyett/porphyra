from __future__ import annotations

from typing import (
    Any,
    ClassVar,
    Generic,
    Protocol,
    Self,
    TypeVar,
    cast,
    runtime_checkable,
)
from uuid import UUID

from pydantic import Field
from sqlalchemy.orm import Session

from app.schemas.base import ApiModel

TIdentity = TypeVar("TIdentity", bound=ApiModel, covariant=True)


@runtime_checkable
class CanSync(Protocol[TIdentity]):
    """A response with a declared wire identity and default sync publication."""

    sync_tag: ClassVar[str]

    @classmethod
    def sync_identity_type(cls) -> type[TIdentity]: ...

    def sync_identity(self) -> TIdentity: ...

    def sync_target(self):
        from app.sync.contracts import SyncTarget

        return SyncTarget(
            self.sync_tag,
            self.sync_identity().model_dump(mode="json", by_alias=True),
        )

    def publish(self, db: Session) -> Self:
        from app.sync.publish import publish

        return publish(self, session=db)


class SyncModel(Generic[TIdentity]):
    """Concrete mixin for Pydantic models that satisfy ``CanSync``."""

    sync_tag: ClassVar[str]

    @classmethod
    def sync_identity_type(cls) -> type[TIdentity]:
        raise NotImplementedError

    def sync_identity(self) -> TIdentity:
        raise NotImplementedError

    def sync_target(self):
        return CanSync.sync_target(self)

    def publish(self, db: Session) -> Self:
        return cast(Self, CanSync.publish(self, db))


class SyncableApiModel(ApiModel, SyncModel[Any]):
    """API response with an internal, serialization-excluded sync audience."""

    sync_recipient_ids: list[UUID] = Field(exclude=True, repr=False)

    def publish_sync_to(self) -> list[UUID]:
        return list(self.sync_recipient_ids)
