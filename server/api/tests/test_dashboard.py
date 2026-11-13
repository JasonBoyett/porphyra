import jwt
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def test_dashboard_includes_development_churches() -> None:
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
    with TestClient(app) as client:
        response = client.get(
            "/api/v1/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert response.status_code == 200
    assert response.json()["viewer"]["email"] == "dev@a244.tech"
    assert len(response.json()["churches"]) == 3
