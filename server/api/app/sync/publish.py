from __future__ import annotations

import json
from collections.abc import Iterable
from typing import TypeVar
from uuid import UUID

from sqlalchemy.orm import Session

from app.sync.call_key import current_call_key
from app.sync.contracts import SyncTarget
from app.sync.model import CanSync
from app.sync.registry import SyncNotification, socket_registry
from app.sync.tags import SyncTag
from app.sync.types import SyncPublishable

_PENDING_NOTIFICATIONS_KEY = "sync_pending_notifications"
T = TypeVar("T")


def publish(
    data: T,
    *,
    tags: Iterable[SyncTag] = (),
    targets: Iterable[SyncTarget] = (),
    recipients: Iterable[UUID] | None = None,
    session: Session | None = None,
) -> T:
    """Queue post-commit stale signals and return ``data`` unchanged."""
    if not targets and isinstance(data, CanSync):
        targets = (data.sync_target(),)
    unique_targets = tuple(
        {
            (target.tag, tuple(sorted(target.identity.items()))): target
            for target in targets
        }.values()
    )
    recipient_ids = (
        data.publish_sync_to()
        if recipients is None and isinstance(data, SyncPublishable)
        else recipients
    )
    if recipient_ids is None:
        raise ValueError("Sync recipients are required for data without an audience.")
    notification = SyncNotification(
        recipients=tuple(sorted(set(recipient_ids), key=str)),
        tags=tuple(sorted(set(tags), key=str)),
        targets=unique_targets,
        call_key=current_call_key(),
    )
    if not notification.recipients or (
        not notification.tags and not notification.targets
    ):
        return data
    if session is None:
        socket_registry.notify(notification)
        return data
    pending = session.info.setdefault(_PENDING_NOTIFICATIONS_KEY, [])
    pending.append(notification)
    return data


def publish_authorization_change(
    *,
    recipients: Iterable[UUID],
    church_id: UUID,
    campus_id: UUID | None = None,
    session: Session | None = None,
) -> None:
    """Queue a recipient-specific effective-permissions refresh after commit."""
    notification = SyncNotification(
        recipients=tuple(sorted(set(recipients), key=str)),
        tags=(),
        authorization_church_id=church_id,
        authorization_campus_id=campus_id,
    )
    if session is None:
        socket_registry.notify(notification)
        return
    session.info.setdefault(_PENDING_NOTIFICATIONS_KEY, []).append(notification)


def dispatch_session_notifications(session: Session) -> None:
    pending = session.info.pop(_PENDING_NOTIFICATIONS_KEY, [])
    unique_notifications = {
        (
            notification.recipients,
            notification.tags,
            json.dumps(
                [target.wire_value() for target in notification.targets],
                sort_keys=True,
                separators=(",", ":"),
            ),
            notification.call_key,
            notification.authorization_church_id,
            notification.authorization_campus_id,
        ): notification
        for notification in pending
    }
    for notification in unique_notifications.values():
        socket_registry.notify(notification)


def discard_session_notifications(session: Session) -> None:
    session.info.pop(_PENDING_NOTIFICATIONS_KEY, None)
