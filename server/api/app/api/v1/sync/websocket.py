from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlmodel import select

from app.auth import decode_access_token
from app.db.models import User
from app.db.session import SessionFactory
from app.sync.registry import socket_registry

router = APIRouter()

_PROTOCOL = "porphyra.sync.v1"
_TOKEN_PROTOCOL_PREFIX = "porphyra.jwt."


def _access_token(websocket: WebSocket) -> str | None:
    protocols = websocket.scope.get("subprotocols", [])
    if _PROTOCOL not in protocols:
        return None
    for protocol in protocols:
        if protocol.startswith(_TOKEN_PROTOCOL_PREFIX):
            return protocol.removeprefix(_TOKEN_PROTOCOL_PREFIX)
    return None


@router.websocket("")
async def sync_socket(websocket: WebSocket) -> None:
    token = _access_token(websocket)
    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        claims = decode_access_token(token)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    subject = claims.get("sub")
    if not isinstance(subject, str):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    with SessionFactory() as db:
        user = db.exec(select(User).where(User.auth_id == subject)).one_or_none()
        if user is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = user.id

    await websocket.accept(subprotocol=_PROTOCOL)
    connection_id = socket_registry.register(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        socket_registry.unregister(user_id, connection_id)
