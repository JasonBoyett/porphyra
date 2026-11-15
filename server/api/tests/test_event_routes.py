from datetime import UTC, datetime

import jwt
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def _development_headers() -> dict[str, str]:
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


def test_schedule_a_campus_event_team() -> None:
	starts_at = datetime(2026, 12, 20, 15, tzinfo=UTC).isoformat()
	with TestClient(app) as client:
		headers = _development_headers()
		dashboard = client.get("/api/v1/dashboard", headers=headers).json()
		church = dashboard["churches"][0]
		ministry = church["ministries"][0]
		team = ministry["teams"][0]

		event_response = client.post(
			"/api/v1/events/campus/",
			headers=headers,
			json={
				"churchId": church["id"],
				"campusId": church["campuses"][0]["id"],
				"title": "Christmas Gathering",
				"startsAt": starts_at,
			},
		)
		assert event_response.status_code == 201
		event = event_response.json()
		assert event["isStaffed"] is False

		ministry_response = client.post(
			f"/api/v1/events/campus/{event['id']}/ministries",
			headers=headers,
			json={"ministryId": ministry["id"]},
		)
		assert ministry_response.status_code == 201

		team_response = client.post(
			f"/api/v1/events/campus/ministries/{ministry_response.json()['id']}/teams",
			headers=headers,
			json={
				"teamId": team["id"],
				"callTime": starts_at,
				"notes": ["Meet in the green room."],
			},
		)
		assert team_response.status_code == 201
		assert team_response.json()["notes"] == ["Meet in the green room."]
		assert team_response.json()["confirmedAt"] is None
