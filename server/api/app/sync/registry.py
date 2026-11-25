from __future__ import annotations

import asyncio
import logging
import threading
from dataclasses import dataclass
from typing import Any
from uuid import UUID, uuid4

from fastapi import WebSocket

from app.sync.contracts import SyncTarget
from app.sync.tags import SyncTag

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SyncNotification:
    recipients: tuple[UUID, ...]
    tags: tuple[SyncTag, ...]
    targets: tuple[SyncTarget, ...] = ()
    call_key: UUID | None = None


@dataclass(frozen=True)
class _LiveSocket:
    websocket: WebSocket
    loop: asyncio.AbstractEventLoop


class SocketRegistry:
    """Best-effort, process-local authenticated user-to-tab registry."""

    def __init__(self) -> None:
        self._sockets: dict[UUID, dict[UUID, _LiveSocket]] = {}
        self._lock = threading.Lock()

    def register(self, user_id: UUID, websocket: WebSocket) -> UUID:
        connection_id = uuid4()
        live_socket = _LiveSocket(
            websocket=websocket,
            loop=asyncio.get_running_loop(),
        )
        with self._lock:
            self._sockets.setdefault(user_id, {})[connection_id] = live_socket
        return connection_id

    def unregister(self, user_id: UUID, connection_id: UUID) -> None:
        with self._lock:
            connections = self._sockets.get(user_id)
            if connections is None:
                return
            connections.pop(connection_id, None)
            if not connections:
                self._sockets.pop(user_id, None)

    def notify(self, notification: SyncNotification) -> None:
        payload: dict[str, Any]
        if notification.targets:
            payload = {
                "type": "sync.invalidate",
                "targets": [target.wire_value() for target in notification.targets],
            }
            if notification.tags:
                payload["tags"] = list(notification.tags)
            if notification.call_key is not None:
                payload["callKey"] = str(notification.call_key)
        else:
            payload = {"type": "changed", "tags": list(notification.tags)}
        with self._lock:
            connections = [
                connection
                for user_id in notification.recipients
                for connection in self._sockets.get(user_id, {}).values()
            ]
        for connection in connections:
            future = asyncio.run_coroutine_threadsafe(
                connection.websocket.send_json(payload),
                connection.loop,
            )
            future.add_done_callback(self._log_delivery_failure)

    @staticmethod
    def _log_delivery_failure(future: Any) -> None:
        try:
            future.result()
        except Exception:
            logger.debug("Unable to deliver realtime invalidation", exc_info=True)


socket_registry = SocketRegistry()
