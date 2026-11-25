from uuid import UUID

from app.api.v1.campuses._responses import campus_location_response
from app.api.v1.events.schemas import CampusEventResponse, EventResponse
from app.db.models import CampusEvent, ChurchEvent


def campus_event_response(
	event: CampusEvent,
	*,
	sync_recipient_ids: list[UUID],
) -> CampusEventResponse:
	return CampusEventResponse(
		sync_recipient_ids=sync_recipient_ids,
		id=event.id,
		church_id=event.church_id,
		campus_id=event.campus_id,
		campus_location=campus_location_response(event.campus),
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
