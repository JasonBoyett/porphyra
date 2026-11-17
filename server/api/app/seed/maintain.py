import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

_MINIMUM_EVENT_LEAD_TIME = timedelta(weeks=1)


def maintain_seed_dates(
	path: Path | None = None, *, now: datetime | None = None
) -> bool:
	"""Move past seed events forward while retaining each event's schedule offsets."""
	data_path = path or Path(__file__).with_name("data.json")
	data = json.loads(data_path.read_text())
	current_time = now or datetime.now(UTC)
	changed = False

	for church in data["churches"]:
		for event_key in ("campusEvents", "churchEvents"):
			for event in church.get(event_key, []):
				starts_at = datetime.fromisoformat(event["startsAt"])
				if starts_at >= current_time:
					continue

				advance_by = current_time + _MINIMUM_EVENT_LEAD_TIME - starts_at
				_shift_event_dates(event, advance_by)
				changed = True

	if changed:
		data_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

	return changed


def _shift_event_dates(event: dict[str, Any], advance_by: timedelta) -> None:
	for date_key in ("startsAt", "endsAt"):
		if event.get(date_key) is not None:
			event[date_key] = _shift_iso_date(event[date_key], advance_by)

	for ministry in event.get("ministries", []):
		for team in ministry.get("teams", []):
			if team.get("callTime") is not None:
				team["callTime"] = _shift_iso_date(team["callTime"], advance_by)


def _shift_iso_date(value: str, advance_by: timedelta) -> str:
	return (datetime.fromisoformat(value) + advance_by).isoformat()
