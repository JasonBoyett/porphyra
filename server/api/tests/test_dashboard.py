from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_includes_development_churches() -> None:
    response = TestClient(app).get("/api/v1/dashboard")
    assert response.status_code == 200
    assert response.json()["viewer"]["email"] == "dev@a244.tech"
    assert len(response.json()["organizations"]) == 3
