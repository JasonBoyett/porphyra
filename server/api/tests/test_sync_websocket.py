from uuid import UUID

import jwt
import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.config import settings
from app.main import app
from app.sync.contracts import SyncTarget
from app.sync.registry import SyncNotification, socket_registry


def _token(subject: str, email: str) -> str:
    return jwt.encode(
        {
            "aud": settings.auth_audience,
            "email": email,
            "exp": 4_102_444_800,
            "iss": settings.auth_issuer,
            "name": email,
            "sub": subject,
        },
        settings.auth_jwt_secret,
        algorithm="HS256",
    )


def _protocols(token: str) -> list[str]:
    return ["porphyra.sync.v1", f"porphyra.jwt.{token}"]


def _provision(client: TestClient, token: str) -> UUID:
    response = client.get(
        "/api/v1/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    return UUID(response.json()["id"])


def test_sync_socket_rejects_missing_invalid_and_unknown_authentication() -> None:
    with TestClient(app) as client:
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect("/api/v1/sync"):
                pass
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols("not-a-token")
            ):
                pass
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(
                "/api/v1/sync",
                subprotocols=_protocols(
                    _token("not-provisioned", "nobody@example.com")
                ),
            ):
                pass


def test_sync_socket_supports_multiple_tabs_and_isolates_recipients() -> None:
    first_token = _token("sync-first", "sync-first@example.com")
    second_token = _token("sync-second", "sync-second@example.com")
    with TestClient(app) as client:
        first_user_id = _provision(client, first_token)
        second_user_id = _provision(client, second_token)
        with (
            client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols(first_token)
            ) as first_tab,
            client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols(first_token)
            ) as second_tab,
            client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols(second_token)
            ) as other_user_tab,
        ):
            assert first_tab.accepted_subprotocol == "porphyra.sync.v1"
            socket_registry.notify(SyncNotification((first_user_id,), ("dashboard",)))
            assert first_tab.receive_json() == {
                "type": "changed",
                "tags": ["dashboard"],
            }
            assert second_tab.receive_json() == {
                "type": "changed",
                "tags": ["dashboard"],
            }
            socket_registry.notify(
                SyncNotification((second_user_id,), ("campus-events",))
            )
            assert other_user_tab.receive_json() == {
                "type": "changed",
                "tags": ["campus-events"],
            }


def test_disconnected_tab_does_not_prevent_remaining_tab_delivery() -> None:
    token = _token("sync-cleanup", "sync-cleanup@example.com")
    with TestClient(app) as client:
        user_id = _provision(client, token)
        with client.websocket_connect(
            "/api/v1/sync", subprotocols=_protocols(token)
        ) as remaining_tab:
            with client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols(token)
            ):
                pass
            socket_registry.notify(
                SyncNotification((user_id,), ("campus-event-planning",))
            )
            assert remaining_tab.receive_json()["tags"] == ["campus-event-planning"]


def test_sync_socket_broadcasts_identity_targets_to_every_tab() -> None:
    token = _token("sync-target", "sync-target@example.com")
    with TestClient(app) as client:
        user_id = _provision(client, token)
        with (
            client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols(token)
            ) as first_tab,
            client.websocket_connect(
                "/api/v1/sync", subprotocols=_protocols(token)
            ) as second_tab,
        ):
            socket_registry.notify(
                SyncNotification(
                    (user_id,),
                    (),
                    (SyncTarget("assignments", {"id": "assignment-42"}),),
                )
            )
            expected = {
                "type": "sync.invalidate",
                "targets": [
                    {"tag": "assignments", "identity": {"id": "assignment-42"}}
                ],
            }
            assert first_tab.receive_json() == expected
            assert second_tab.receive_json() == expected
