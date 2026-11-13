import jwt
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def make_access_token() -> str:
    return jwt.encode(
        {
            "aud": settings.auth_audience,
            "email": "identity@example.com",
            "exp": 4_102_444_800,
            "iss": settings.auth_issuer,
            "name": "Identity Example",
            "sub": "auth-subject-123",
        },
        settings.auth_jwt_secret,
        algorithm="HS256",
    )


def test_me_requires_a_bearer_token() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/me")
    assert response.status_code == 401


def test_me_provisions_the_authenticated_user_identity() -> None:
    with TestClient(app) as client:
        response = client.get(
            "/api/v1/me",
            headers={"Authorization": f"Bearer {make_access_token()}"},
        )
    assert response.status_code == 200
    assert response.json()["auth_id"] == "auth-subject-123"
    assert response.json()["email"] == "identity@example.com"
