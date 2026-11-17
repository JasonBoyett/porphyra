import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.seed.maintain import maintain_seed_dates


def test_maintain_seed_dates_advances_past_event_dates_together(
	tmp_path: Path,
) -> None:
	seed_path = tmp_path / "data.json"
	seed_path.write_text(
		json.dumps(
			{
				"churches": [
					{
						"campusEvents": [
							{
								"startsAt": "2026-11-15T15:00:00+00:00",
								"endsAt": "2026-11-15T16:15:00+00:00",
								"ministries": [
									{
										"teams": [
											{
												"callTime": (
													"2026-11-15T13:30:00+00:00"
												)
											},
											{"callTime": None},
										]
									}
								],
							}
						]
					}
				]
			}
		)
	)
	now = datetime(2026, 11, 16, 8, tzinfo=UTC)

	assert maintain_seed_dates(seed_path, now=now) is True

	event = json.loads(seed_path.read_text())["churches"][0]["campusEvents"][0]
	starts_at = datetime.fromisoformat(event["startsAt"])
	ends_at = datetime.fromisoformat(event["endsAt"])
	call_time = datetime.fromisoformat(event["ministries"][0]["teams"][0]["callTime"])

	assert starts_at == now + timedelta(weeks=1)
	assert ends_at - starts_at == timedelta(hours=1, minutes=15)
	assert call_time - starts_at == timedelta(hours=-1, minutes=-30)
	assert event["ministries"][0]["teams"][1]["callTime"] is None


def test_maintain_seed_dates_is_idempotent_and_leaves_future_events_unchanged(
	tmp_path: Path,
) -> None:
	seed_path = tmp_path / "data.json"
	seed_path.write_text(
		json.dumps(
			{
				"churches": [
					{
						"campusEvents": [
							{
								"startsAt": "2026-11-15T15:00:00+00:00",
								"endsAt": None,
								"ministries": [],
							},
							{
								"startsAt": "2026-12-01T15:00:00+00:00",
								"endsAt": None,
								"ministries": [],
							},
						]
					}
				]
			}
		)
	)
	now = datetime(2026, 11, 16, 8, tzinfo=UTC)

	assert maintain_seed_dates(seed_path, now=now) is True
	updated_data = seed_path.read_text()
	assert maintain_seed_dates(seed_path, now=now) is False
	assert seed_path.read_text() == updated_data

	events = json.loads(updated_data)["churches"][0]["campusEvents"]
	assert events[1]["startsAt"] == "2026-12-01T15:00:00+00:00"
