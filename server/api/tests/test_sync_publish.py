from dataclasses import dataclass
from uuid import UUID, uuid4

from sqlmodel import Session

from app.sync.publish import publish
from app.sync.registry import SyncNotification, socket_registry
from app.sync.tags import SyncTag


@dataclass
class SyncValue:
    value: object
    recipients: list[UUID]

    def publish_sync_to(self) -> list[UUID]:
        return list(self.recipients)


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
        tags=[SyncTag.CAMPUS_EVENTS, SyncTag.CAMPUS_EVENTS],
    )

    assert result is data
    assert notifications == [
        SyncNotification(
            recipients=tuple(sorted((first_user, second_user), key=str)),
            tags=(SyncTag.CAMPUS_EVENTS,),
        )
    ]


def test_publish_ignores_empty_recipients_or_tags(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)

    publish(SyncValue("no recipients", []), tags=[SyncTag.DASHBOARD])
    publish(SyncValue("no tags", [uuid4()]), tags=[])

    assert notifications == []


def test_transaction_publish_dispatches_only_after_commit(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    user_id = uuid4()

    with Session() as session:
        data = SyncValue("queued", [user_id])
        publish(
            data,
            tags=[SyncTag.CAMPUS_EVENTS],
            session=session,
        )
        assert notifications == []
        session.commit()

    assert notifications == [SyncNotification((user_id,), (SyncTag.CAMPUS_EVENTS,))]


def test_transaction_publish_is_discarded_on_rollback(monkeypatch) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)

    with Session() as session:
        session.begin()
        publish(
            SyncValue("queued", [uuid4()]),
            tags=[SyncTag.DASHBOARD],
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
                tags=[SyncTag.CAMPUS_EVENTS],
                session=session,
            )
        publish(
            SyncValue("distinct", [user_id]),
            tags=[SyncTag.CAMPUS_EVENT_PLANNING],
            session=session,
        )
        session.commit()

    assert notifications == [
        SyncNotification((user_id,), (SyncTag.CAMPUS_EVENTS,)),
        SyncNotification((user_id,), (SyncTag.CAMPUS_EVENT_PLANNING,)),
    ]
