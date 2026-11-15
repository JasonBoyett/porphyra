from datetime import UTC, datetime
from uuid import UUID

import jwt
from fastapi.testclient import TestClient

from app.config import settings
from app.db.session import SessionFactory
from app.main import app
from app.sync.audience import church_member_user_ids
from app.sync.registry import SyncNotification, socket_registry
from app.sync.tags import SyncTag


def _headers() -> dict[str, str]:
    token = jwt.encode(
        {
            "aud": settings.auth_audience,
            "email": "dev@a244.tech",
            "exp": 4_102_444_800,
            "iss": settings.auth_issuer,
            "name": "Development User",
            "sub": "development:dev@a244.tech",
        },
        settings.auth_jwt_secret,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def test_create_campus_event_publishes_exact_church_audience_and_tags(
    monkeypatch,
) -> None:
    notifications: list[SyncNotification] = []
    monkeypatch.setattr(socket_registry, "notify", notifications.append)
    with TestClient(app) as client:
        dashboard = client.get("/api/v1/dashboard", headers=_headers()).json()
        church = dashboard["churches"][0]
        church_id = UUID(church["id"])
        with SessionFactory() as db:
            expected_recipients = tuple(
                sorted(church_member_user_ids(db, church_id), key=str)
            )

        response = client.post(
            "/api/v1/events/campus/",
            headers=_headers(),
            json={
                "churchId": church["id"],
                "campusId": church["campuses"][0]["id"],
                "title": "Realtime Test Gathering",
                "startsAt": datetime(2027, 1, 10, 15, tzinfo=UTC).isoformat(),
            },
        )

    assert response.status_code == 201
    assert "syncRecipientIds" not in response.json()
    assert notifications == [
        SyncNotification(
            recipients=expected_recipients,
            tags=(SyncTag.CAMPUS_EVENT_PLANNING, SyncTag.CAMPUS_EVENTS),
        )
    ]
