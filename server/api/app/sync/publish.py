from __future__ import annotations

from collections.abc import Iterable
from typing import TypeVar

from sqlalchemy.orm import Session

from app.sync.registry import SyncNotification, socket_registry
from app.sync.tags import SyncTag
from app.sync.types import Syncable

_PENDING_NOTIFICATIONS_KEY = "sync_pending_notifications"
T = TypeVar("T", bound=Syncable)


def publish(
    data: T,
    *,
    tags: Iterable[SyncTag],
    session: Session | None = None,
) -> T:
    """Queue ``data``'s generic stale signal and return it unchanged."""
    notification = SyncNotification(
        recipients=tuple(sorted(set(data.publish_sync_to()), key=str)),
        tags=tuple(sorted(set(tags), key=str)),
    )
    if not notification.recipients or not notification.tags:
        return data
    if session is None:
        socket_registry.notify(notification)
        return data
    pending = session.info.setdefault(_PENDING_NOTIFICATIONS_KEY, [])
    pending.append(notification)
    return data


def dispatch_session_notifications(session: Session) -> None:
    pending = session.info.pop(_PENDING_NOTIFICATIONS_KEY, [])
    for notification in dict.fromkeys(pending):
        socket_registry.notify(notification)


def discard_session_notifications(session: Session) -> None:
    session.info.pop(_PENDING_NOTIFICATIONS_KEY, None)
