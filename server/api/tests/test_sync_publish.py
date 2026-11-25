from dataclasses import dataclass
from typing import ClassVar
from uuid import UUID, uuid4

from sqlmodel import Session

from app.schemas.base import ApiModel
from app.sync.contracts import SyncTarget
from app.sync.model import CanSync, SyncableApiModel
from app.sync.publish import publish
from app.sync.registry import SyncNotification, socket_registry


@dataclass
class SyncValue:
    value: object
    recipients: list[UUID]

    def publish_sync_to(self) -> list[UUID]:
        return list(self.recipients)


class ExampleIdentity(ApiModel):
    id: UUID


class ExampleSyncValue(SyncableApiModel):
    sync_tag: ClassVar[str] = "example-values"
    id: UUID

    @classmethod
    def sync_identity_type(cls) -> type[ExampleIdentity]:
        return ExampleIdentity

    def sync_identity(self) -> ExampleIdentity:
        return ExampleIdentity(id=self.id)


def test_publish_returns_data_unchanged_and_deduplicates(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    first_user = uuid4()
    second_user = uuid4()
    data = SyncValue(
        value={"saved": True},
        recipients=[second_user, first_user, second_user],
    )

    result = publish(
        data,
        tags=["campus-events", "campus-events"],
    )

    assert result is data
    assert notifications == [
        SyncNotification(
            recipients=tuple(sorted((first_user, second_user), key=str)),
            tags=("campus-events",),
        )
    ]


def test_publish_ignores_empty_recipients_or_tags(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)

    publish(SyncValue("no recipients", []), tags=["dashboard"])
    publish(SyncValue("no tags", [uuid4()]), tags=[])

    assert notifications == []


def test_publish_sends_compact_identity_targets(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    user_id = uuid4()

    publish(
        SyncValue("changed", [user_id]),
        targets=[
            SyncTarget("assignments", {"id": "assignment-42"}),
            SyncTarget("assignments", {"id": "assignment-42"}),
        ],
    )

    assert notifications == [
        SyncNotification(
            recipients=(user_id,),
            tags=(),
            targets=(SyncTarget("assignments", {"id": "assignment-42"}),),
        )
    ]


def test_can_sync_default_publish_derives_its_resource_target(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    user_id = uuid4()
    value = ExampleSyncValue(sync_recipient_ids=[user_id], id=uuid4())

    assert isinstance(value, CanSync)
    with Session() as session:
        assert value.publish(session) is value
        session.commit()

    assert notifications == [
        SyncNotification(
            recipients=(user_id,),
            tags=(),
            targets=(
                SyncTarget("example-values", {"id": str(value.id)}),
            ),
        )
    ]


def test_transaction_publish_dispatches_only_after_commit(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    user_id = uuid4()

    with Session() as session:
        data = SyncValue("queued", [user_id])
        publish(
            data,
            tags=["campus-events"],
            session=session,
        )
        assert notifications == []
        session.commit()

    assert notifications == [SyncNotification((user_id,), ("campus-events",))]


def test_transaction_publish_is_discarded_on_rollback(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)

    with Session() as session:
        session.begin()
        publish(
            SyncValue("queued", [uuid4()]),
            tags=["dashboard"],
            session=session,
        )
        session.rollback()
        session.commit()

    assert notifications == []


def test_commit_coalesces_identical_notifications_but_preserves_distinct_ones(
    monkeypatch,
) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    user_id = uuid4()

    with Session() as session:
        for _ in range(2):
            publish(
                SyncValue("same", [user_id]),
                tags=["campus-events"],
                session=session,
            )
        publish(
            SyncValue("distinct", [user_id]),
            tags=["campus-event-planning"],
            session=session,
        )
        session.commit()

    assert notifications == [
        SyncNotification((user_id,), ("campus-events",)),
        SyncNotification((user_id,), ("campus-event-planning",)),
    ]
