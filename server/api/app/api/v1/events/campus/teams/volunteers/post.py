from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events.schemas import (
	AssignVolunteerRequest,
	UpdateVolunteerRoleRequest,
	VolunteerAssignmentResponse,
	VolunteerRequestResponse,
)
from app.auth import CurrentUser
from app.db.models import (
	CampusEventTeam,
	CampusEventTeamVolunteer,
	TeamMembership,
	VolunteerRequest,
	VolunteerRequestStatus,
)
from app.scheduling.conflicts import get_schedule_conflicts
from app.scheduling.roles import assign_user_to_role
from app.sync.audience import church_member_user_ids
from app.sync.publish import publish

router = APIRouter()


def _request_response(request: VolunteerRequest) -> VolunteerRequestResponse:
	return VolunteerRequestResponse(
		id=request.id,
		campus_event_team_id=request.campus_event_team_id,
		team_membership_id=request.team_membership_id,
		role_name=request.role_name,
		role_emoji=request.role_emoji,
		status=request.status,
		replacing_id=request.replacing_id,
	)


def _get_event_team(
	event_team_id: UUID, db: DatabaseSession, user: CurrentUser
) -> CampusEventTeam:
	event_team = db.get(CampusEventTeam, event_team_id)
	if event_team is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	get_church_membership_or_404(
		event_team.event_ministry.event.church_id, user=user, db=db
	)
	return event_team


def _validate_membership(
	event_team: CampusEventTeam,
	team_membership_id: UUID,
	db: DatabaseSession,
) -> TeamMembership:
	team_membership = db.get(TeamMembership, team_membership_id)
	if (
		team_membership is None
		or team_membership.team_id != event_team.team_id
		or team_membership.church_membership.church_id
		!= event_team.event_ministry.event.church_id
	):
		raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
	return team_membership


def _terminal_requests(
	db: DatabaseSession, event_team_id: UUID
) -> list[VolunteerRequest]:
	"""Fetch requests with no successor; replacements hide their predecessor."""
	requests = db.exec(
		select(VolunteerRequest).where(
			VolunteerRequest.campus_event_team_id == event_team_id
		)
	).all()
	replaced_ids = {
		request.replacing_id for request in requests if request.replacing_id
	}
	return [request for request in requests if request.id not in replaced_ids]


def _resolve_superseded_requests(
	db: DatabaseSession,
	event_team: CampusEventTeam,
	*,
	role_name: str | None,
) -> None:
	"""Remove outstanding invitations once a role's accepted assignments fill it."""
	if role_name is None:
		return
	role = event_team.role_data.root.get(role_name)
	if role is None or len(role.scheduled_users) < role.count:
		return
	for request in _terminal_requests(db, event_team.id):
		if (
			request.role_name == role_name
			and request.status == VolunteerRequestStatus.PENDING
		):
			request.status = VolunteerRequestStatus.RESOLVED
			db.add(request)


def _validate_role_capacity(
	db: DatabaseSession,
	event_team: CampusEventTeam,
	*,
	role_name: str | None,
) -> str | None:
	if role_name is None:
		return None
	role = event_team.role_data.root.get(role_name)
	if role is None:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
			detail="The selected role is not configured for this team.",
		)
	reserved = sum(
		assignment.role_name == role_name for assignment in event_team.volunteers
	) + sum(
		request.role_name == role_name
		and request.status == VolunteerRequestStatus.PENDING
		for request in _terminal_requests(db, event_team.id)
	)
	if reserved >= role.count:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail="The selected role has no remaining openings.",
		)
	return role.emoji


def _validate_role_change_capacity(
	event_team: CampusEventTeam,
	assignment: CampusEventTeamVolunteer,
	*,
	role_name: str | None,
) -> None:
	if role_name is None:
		return
	role = event_team.role_data.root.get(role_name)
	if role is None:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
			detail="The selected role is not configured for this team.",
		)
	user_id = assignment.team_membership.church_membership.user_id
	other_scheduled_users = [
		scheduled_user_id
		for scheduled_user_id in role.scheduled_users
		if scheduled_user_id != user_id
	]
	if len(other_scheduled_users) >= role.count:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail="The selected role has no remaining openings.",
		)


def _create_request(
	event_team: CampusEventTeam,
	payload: AssignVolunteerRequest,
	db: DatabaseSession,
	*,
	replacing_id: UUID | None = None,
) -> VolunteerRequest:
	team_membership = _validate_membership(event_team, payload.team_membership_id, db)
	if any(
		assignment.team_membership_id == team_membership.id
		for assignment in event_team.volunteers
	) or any(
		request.team_membership_id == team_membership.id
		and request.status == VolunteerRequestStatus.PENDING
		for request in _terminal_requests(db, event_team.id)
	):
		raise HTTPException(status_code=status.HTTP_409_CONFLICT)
	conflicts = get_schedule_conflicts(db, event_team, team_membership)
	if conflicts and not payload.confirm_conflict:
		raise HTTPException(
			status_code=status.HTTP_409_CONFLICT,
			detail={
				"code": "schedule_conflict",
				"conflicts": [
					{
						"eventId": str(conflict.event_id),
						"eventTitle": conflict.event_title,
						"teamName": conflict.team_name,
						"startsAt": conflict.starts_at.isoformat(),
						"endsAt": conflict.ends_at.isoformat(),
					}
					for conflict in conflicts
				],
			},
		)
	role_emoji = _validate_role_capacity(
		db, event_team, role_name=payload.role_name
	)
	request = VolunteerRequest(
		campus_event_team_id=event_team.id,
		team_membership_id=team_membership.id,
		role_name=payload.role_name,
		role_emoji=role_emoji or payload.role_emoji,
		replacing_id=replacing_id,
	)
	db.add(request)
	return request


@router.post(
	"/{event_team_id}/volunteers",
	operation_id="assignCampusEventVolunteer",
	status_code=status.HTTP_201_CREATED,
)
def assign_volunteer(
	event_team_id: UUID,
	payload: AssignVolunteerRequest,
	db: DatabaseSession,
	user: CurrentUser,
) -> VolunteerRequestResponse:
	"""Create a pending roster request; acceptance creates the assignment."""
	event_team = _get_event_team(event_team_id, db, user)
	request = _create_request(event_team, payload, db)
	db.commit()
	db.refresh(request)
	return _request_response(request)


@router.post(
	"/{event_team_id}/volunteer-requests/{request_id}/replacement",
	status_code=status.HTTP_201_CREATED,
)
def create_replacement(
	event_team_id: UUID,
	request_id: UUID,
	payload: AssignVolunteerRequest,
	db: DatabaseSession,
	user: CurrentUser,
) -> VolunteerRequestResponse:
	event_team = _get_event_team(event_team_id, db, user)
	request = db.get(VolunteerRequest, request_id)
	if request is None or request.campus_event_team_id != event_team.id:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	if request.status != VolunteerRequestStatus.REJECTED:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT)
	if request.role_name != payload.role_name:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
			detail="Replacement requests must use the same role.",
		)
	if any(
		candidate.replacing_id == request.id
		for candidate in event_team.volunteer_requests
	):
		raise HTTPException(status_code=status.HTTP_409_CONFLICT)
	successor = _create_request(
		event_team, payload, db, replacing_id=request.id
	)
	try:
		db.commit()
	except IntegrityError as error:
		db.rollback()
		raise HTTPException(status_code=status.HTTP_409_CONFLICT) from error
	db.refresh(successor)
	return _request_response(successor)


@router.post("/{event_team_id}/volunteer-requests/{request_id}/accept")
def accept_volunteer_request(
	event_team_id: UUID,
	request_id: UUID,
	db: DatabaseSession,
	user: CurrentUser,
) -> VolunteerAssignmentResponse:
	event_team = _get_event_team(event_team_id, db, user)
	request = db.get(VolunteerRequest, request_id)
	if (
		request is None
		or request.campus_event_team_id != event_team.id
		or request.status != VolunteerRequestStatus.PENDING
		or request not in _terminal_requests(db, event_team.id)
	):
		raise HTTPException(status_code=status.HTTP_409_CONFLICT)
	try:
		ancestors = request.rejected_ancestors(db)
	except ValueError as error:
		raise HTTPException(
			status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
			detail=str(error),
		)
	team_membership = _validate_membership(event_team, request.team_membership_id, db)
	if any(
		assignment.team_membership_id == team_membership.id
		for assignment in event_team.volunteers
	):
		raise HTTPException(status_code=status.HTTP_409_CONFLICT)
	assignment = CampusEventTeamVolunteer(
		campus_event_team_id=event_team.id,
		team_membership_id=team_membership.id,
		role_name=request.role_name,
		role_emoji=request.role_emoji,
	)
	if request.role_name is not None:
		event_team.roles = assign_user_to_role(
			event_team.role_data,
			role_name=request.role_name,
			user_id=team_membership.church_membership.user_id,
		).model_dump(mode="json")
	_resolve_superseded_requests(db, event_team, role_name=request.role_name)
	request.status = VolunteerRequestStatus.ACCEPTED
	for ancestor in ancestors:
		ancestor.status = VolunteerRequestStatus.REJECTED_RESOLVED
		db.add(ancestor)
	db.add(event_team)
	db.add(request)
	db.add(assignment)
	db.flush()
	response = publish(
		VolunteerAssignmentResponse(
			sync_recipient_ids=church_member_user_ids(
				db, event_team.event_ministry.event.church_id
			),
			id=assignment.id,
			team_membership_id=assignment.team_membership_id,
			role_name=assignment.role_name,
			role_emoji=assignment.role_emoji,
			conflict_confirmed_at=assignment.conflict_confirmed_at,
		),
		tags=("campus-events", "campus-event-planning"),
		session=db,
	)
	db.commit()
	return response


@router.post("/{event_team_id}/volunteer-requests/{request_id}/decline")
def decline_volunteer_request(
	event_team_id: UUID,
	request_id: UUID,
	db: DatabaseSession,
	user: CurrentUser,
) -> VolunteerRequestResponse:
	event_team = _get_event_team(event_team_id, db, user)
	request = db.get(VolunteerRequest, request_id)
	if (
		request is None
		or request.campus_event_team_id != event_team.id
		or request.status != VolunteerRequestStatus.PENDING
	):
		raise HTTPException(status_code=status.HTTP_409_CONFLICT)
	request.status = VolunteerRequestStatus.REJECTED
	db.add(request)
	db.commit()
	db.refresh(request)
	return _request_response(request)


@router.post(
	"/{event_team_id}/volunteers/role/{volunteer_id}",
	operation_id="changeCampusEventVolunteerRole",
)
def update_volunteer_role(
	event_team_id: UUID,
	volunteer_id: UUID,
	payload: UpdateVolunteerRoleRequest,
	db: DatabaseSession,
	user: CurrentUser,
) -> VolunteerAssignmentResponse:
	event_team = _get_event_team(event_team_id, db, user)
	assignment = db.get(CampusEventTeamVolunteer, volunteer_id)
	if assignment is None or assignment.campus_event_team_id != event_team.id:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	role_name = payload.role_name or None
	if event_team.roles:
		_validate_role_change_capacity(event_team, assignment, role_name=role_name)
		try:
			role_data = assign_user_to_role(
				event_team.role_data,
				role_name=role_name,
				user_id=assignment.team_membership.church_membership.user_id,
			)
		except ValueError as error:
			raise HTTPException(
				status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
				detail=str(error),
			) from error
		event_team.roles = role_data.model_dump(mode="json")
		assignment.role_emoji = (
			role_data.root[role_name].emoji if role_name is not None else None
		)
	else:
		assignment.role_emoji = payload.role_emoji or None
	assignment.role_name = role_name
	_resolve_superseded_requests(db, event_team, role_name=role_name)
	db.add(event_team)
	db.add(assignment)
	db.flush()
	response = publish(
		VolunteerAssignmentResponse(
			sync_recipient_ids=church_member_user_ids(
				db, event_team.event_ministry.event.church_id
			),
			id=assignment.id,
			team_membership_id=assignment.team_membership_id,
			role_name=assignment.role_name,
			role_emoji=assignment.role_emoji,
			conflict_confirmed_at=assignment.conflict_confirmed_at,
		),
		tags=("campus-events", "campus-event-planning"),
		session=db,
	)
	db.commit()
	return response


@router.post(
	"/{event_team_id}/volunteers/drop/{volunteer_id}",
	operation_id="dropCampusEventVolunteer",
)
def drop_volunteer(
	event_team_id: UUID,
	volunteer_id: UUID,
	db: DatabaseSession,
	user: CurrentUser,
) -> VolunteerAssignmentResponse:
	"""Remove an accepted volunteer from the roster and role snapshot."""
	event_team = _get_event_team(event_team_id, db, user)
	assignment = db.get(CampusEventTeamVolunteer, volunteer_id)
	if assignment is None or assignment.campus_event_team_id != event_team.id:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

	if event_team.roles:
		event_team.roles = assign_user_to_role(
			event_team.role_data,
			role_name=None,
			user_id=assignment.team_membership.church_membership.user_id,
		).model_dump(mode="json")
		db.add(event_team)

	response = publish(
		VolunteerAssignmentResponse(
			sync_recipient_ids=church_member_user_ids(
				db, event_team.event_ministry.event.church_id
			),
			id=assignment.id,
			team_membership_id=assignment.team_membership_id,
			role_name=assignment.role_name,
			role_emoji=assignment.role_emoji,
			conflict_confirmed_at=assignment.conflict_confirmed_at,
		),
		tags=("campus-events", "campus-event-planning"),
		session=db,
	)
	db.delete(assignment)
	db.commit()
	return response
