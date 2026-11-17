from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events.schemas import (
	CampusEventListItem,
	CampusEventMinistryScheduleResponse,
	CampusEventPlanningResponse,
	CampusEventTeamScheduleResponse,
	ScheduledVolunteerResponse,
	TeamRoleResponseData,
	VolunteerRequestRosterResponse,
)
from app.auth import CurrentUser
from app.db.models import (
	CampusEvent,
	CampusEventTeam,
	CampusEventTeamVolunteer,
	ChurchMembership,
	TeamMembership,
	VolunteerRequest,
	VolunteerRequestStatus,
)
from app.scheduling.conflicts import get_schedule_conflicts
from app.sync.audience import church_member_user_ids

router = APIRouter()


def _scheduled_volunteer(
	assignment: CampusEventTeamVolunteer,
) -> ScheduledVolunteerResponse:
	team_membership = assignment.team_membership
	user = team_membership.church_membership.user
	return ScheduledVolunteerResponse(
		assignment_id=assignment.id,
		team_membership_id=team_membership.id,
		user_id=user.id,
		name=user.name,
		email=user.email,
		avatar_url=user.avatar_url,
		role_name=assignment.role_name,
		role_emoji=assignment.role_emoji,
		conflict_confirmed_at=assignment.conflict_confirmed_at,
	)


def _eligible_volunteer(
	team_membership: TeamMembership,
) -> ScheduledVolunteerResponse:
	user = team_membership.church_membership.user
	return ScheduledVolunteerResponse(
		assignment_id=team_membership.id,
		team_membership_id=team_membership.id,
		user_id=user.id,
		name=user.name,
		email=user.email,
		avatar_url=user.avatar_url,
		role_name=None,
		role_emoji=None,
		conflict_confirmed_at=None,
	)


def _request_roster_item(
	request: VolunteerRequest,
) -> VolunteerRequestRosterResponse:
	user = request.team_membership.church_membership.user
	return VolunteerRequestRosterResponse(
		id=request.id,
		campus_event_team_id=request.campus_event_team_id,
		team_membership_id=request.team_membership_id,
		role_name=request.role_name,
		role_emoji=request.role_emoji,
		status=request.status,
		replacing_id=request.replacing_id,
		user_id=user.id,
		name=user.name,
		email=user.email,
		avatar_url=user.avatar_url,
	)


def _terminal_requests(
	event_team_id: UUID, db: DatabaseSession
) -> list[VolunteerRequest]:
	requests = db.exec(
		select(VolunteerRequest).where(
			VolunteerRequest.campus_event_team_id == event_team_id
		)
	).all()
	replaced_ids = {
		request.replacing_id for request in requests if request.replacing_id
	}
	return [request for request in requests if request.id not in replaced_ids]


def _role_response(event_team, db: DatabaseSession) -> TeamRoleResponseData:
	terminal_requests = _terminal_requests(event_team.id, db)
	accepted_counts: dict[str, int] = {}
	pending_counts: dict[str, int] = {}
	for assignment in event_team.volunteers:
		if assignment.role_name is not None:
			accepted_counts[assignment.role_name] = (
				accepted_counts.get(assignment.role_name, 0) + 1
			)
	for request in terminal_requests:
		if (
			request.status == VolunteerRequestStatus.PENDING
			and request.role_name is not None
		):
			pending_counts[request.role_name] = (
				pending_counts.get(request.role_name, 0) + 1
			)
	return TeamRoleResponseData.from_role_data(
		event_team.role_data,
		accepted_counts=accepted_counts,
		pending_counts=pending_counts,
	)


def _planning_response(
	db: DatabaseSession,
	event: CampusEvent,
) -> CampusEventPlanningResponse:
	return CampusEventPlanningResponse(
		sync_recipient_ids=church_member_user_ids(db, event.church_id),
		id=event.id,
		church_id=event.church_id,
		church_name=event.church.name,
		campus_id=event.campus_id,
		campus_name=event.campus.name,
		title=event.title,
		description=event.description,
		starts_at=event.starts_at,
		ends_at=event.ends_at,
		is_staffed=event.is_staffed,
		is_fully_staffed=event.is_fully_staffed,
		teams_needing_confirmation=[
			team.id for team in event.teams_needing_confirmation
		],
		ministries=[
			CampusEventMinistryScheduleResponse(
				id=event_ministry.id,
				name=event_ministry.ministry.name,
				teams=[
					CampusEventTeamScheduleResponse(
						id=event_team.id,
						team_id=event_team.team_id,
						name=event_team.team.name,
						call_time=event_team.call_time,
							notes=event_team.notes,
							confirmed_at=event_team.confirmed_at,
							is_fully_staffed=event_team.is_fully_staffed,
							roles=_role_response(event_team, db),
						volunteers=[
							_scheduled_volunteer(assignment)
							for assignment in event_team.volunteers
						],
						volunteer_requests=[
							_request_roster_item(request)
							for request in _terminal_requests(event_team.id, db)
							if request.status
							not in {
								VolunteerRequestStatus.RESOLVED,
								VolunteerRequestStatus.REJECTED_RESOLVED,
							}
						],
						eligible_volunteers=[
							_eligible_volunteer(team_membership)
							for team_membership in event_team.team.memberships
							if team_membership.church_membership.church_id
							== event.church_id
							and not get_schedule_conflicts(
								db,
								event_team,
								team_membership,
							)
							and not any(
								assignment.team_membership_id == team_membership.id
								for assignment in event_team.volunteers
							)
							and not any(
								request.team_membership_id == team_membership.id
								and request.status == VolunteerRequestStatus.PENDING
								for request in _terminal_requests(event_team.id, db)
							)
						],
					)
					for event_team in event_ministry.teams
				],
			)
			for event_ministry in event.ministries
		],
	)


@router.get("/", operation_id="getCampusEvents")
def get_campus_events(
	db: DatabaseSession,
	user: CurrentUser,
) -> list[CampusEventListItem]:
	memberships = db.exec(
		select(ChurchMembership).where(ChurchMembership.user_id == user.id)
	).all()
	return sorted(
		[
			CampusEventListItem(
				id=event.id,
				church_id=event.church_id,
				church_name=event.church.name,
				campus_id=event.campus_id,
				campus_name=event.campus.name,
				title=event.title,
				starts_at=event.starts_at,
				ends_at=event.ends_at,
				is_staffed=event.is_staffed,
				is_fully_staffed=event.is_fully_staffed,
			)
			for membership in memberships
			for event in membership.church.campus_events
		],
		key=lambda event: event.starts_at,
	)


def get_campus_event_planning(
	event_id: UUID,
	db: DatabaseSession,
	user: CurrentUser,
) -> CampusEventPlanningResponse:
	event = db.get(CampusEvent, event_id)
	if event is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	membership = db.exec(
		select(ChurchMembership).where(
			ChurchMembership.church_id == event.church_id,
			ChurchMembership.user_id == user.id,
		)
	).one_or_none()
	if membership is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	return _planning_response(db, event)


@router.get(
	"/teams/{event_team_id}/volunteer-requests",
	operation_id="getCampusEventTeamVolunteerRequests",
)
def get_team_volunteer_requests(
	event_team_id: UUID,
	db: DatabaseSession,
	user: CurrentUser,
	include_resolved: bool = False,
) -> list[VolunteerRequestRosterResponse]:
	"""Coordinator request list; resolved rejections are available as history."""
	event_team = db.get(CampusEventTeam, event_team_id)
	if event_team is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	membership = db.exec(
		select(ChurchMembership).where(
			ChurchMembership.church_id == event_team.event_ministry.event.church_id,
			ChurchMembership.user_id == user.id,
		)
	).one_or_none()
	if membership is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	requests = db.exec(
		select(VolunteerRequest).where(
			VolunteerRequest.campus_event_team_id == event_team.id
		)
	).all()
	if not include_resolved:
		requests = [
			request
			for request in requests
			if request.status
			not in {
				VolunteerRequestStatus.REJECTED_RESOLVED,
				VolunteerRequestStatus.RESOLVED,
			}
		]
	return [_request_roster_item(request) for request in requests]


@router.get("/volunteer-requests", operation_id="getMyVolunteerRequests")
def get_my_volunteer_requests(
	db: DatabaseSession,
	user: CurrentUser,
	include_resolved: bool = False,
) -> list[VolunteerRequestRosterResponse]:
	"""Request records for the signed-in volunteer's tab."""
	requests = db.exec(select(VolunteerRequest)).all()
	return [
		_request_roster_item(request)
		for request in requests
		if request.team_membership.church_membership.user_id == user.id
		and (
			include_resolved
			or request.status != VolunteerRequestStatus.REJECTED_RESOLVED
			and request.status != VolunteerRequestStatus.RESOLVED
		)
	]


router.add_api_route(
	"/{event_id}",
	get_campus_event_planning,
	methods=["GET"],
	operation_id="getCampusEventPlanning",
	response_model=CampusEventPlanningResponse,
)
