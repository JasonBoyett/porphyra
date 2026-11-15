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
)
from app.auth import CurrentUser
from app.db.models import (
	CampusEvent,
	CampusEventTeamVolunteer,
	ChurchMembership,
	TeamMembership,
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
							roles=event_team.role_data,
						volunteers=[
							_scheduled_volunteer(assignment)
							for assignment in event_team.volunteers
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


@router.get("/{event_id}", operation_id="getCampusEventPlanning")
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
