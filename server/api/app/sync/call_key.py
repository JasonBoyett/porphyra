from contextvars import ContextVar
from uuid import UUID

from fastapi import Request

_call_key: ContextVar[UUID | None] = ContextVar("sync_call_key", default=None)


def set_call_key(request: Request) -> object:
    value = request.headers.get("X-Porphyra-Sync-Call-Key")
    try:
        return _call_key.set(UUID(value)) if value is not None else _call_key.set(None)
    except ValueError:
        return _call_key.set(None)


def reset_call_key(token: object) -> None:
    _call_key.reset(token)  # type: ignore[arg-type]


def current_call_key() -> UUID | None:
    return _call_key.get()
