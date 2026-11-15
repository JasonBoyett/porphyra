from app.api.v1.events.schemas import CampusEventResponse, EventResponse
from app.db.models import CampusEvent, ChurchEvent


def campus_event_response(event: CampusEvent) -> CampusEventResponse:
	return CampusEventResponse(
		id=event.id,
		church_id=event.church_id,
		campus_id=event.campus_id,
		title=event.title,
		description=event.description,
		starts_at=event.starts_at,
		ends_at=event.ends_at,
		is_staffed=event.is_staffed,
		is_fully_staffed=event.is_fully_staffed,
		teams_needing_confirmation=[
			team.id for team in event.teams_needing_confirmation
		],
	)


def church_event_response(event: ChurchEvent) -> EventResponse:
	return EventResponse(
		id=event.id,
		church_id=event.church_id,
		title=event.title,
		description=event.description,
		starts_at=event.starts_at,
		ends_at=event.ends_at,
		is_staffed=event.is_staffed,
		is_fully_staffed=event.is_fully_staffed,
		teams_needing_confirmation=[
			team.id for team in event.teams_needing_confirmation
		],
	)
