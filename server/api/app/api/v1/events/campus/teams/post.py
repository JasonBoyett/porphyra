from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events.schemas import (
    ScheduledTeamResponse,
    ScheduleTeamRequest,
    TeamRoleResponseData,
    UpdateTeamRoleRequirementsRequest,
)
from app.auth import CurrentUser
from app.db.models import CampusEventMinistry, CampusEventTeam, Team
from app.scheduling.roles import RoleAssignment, build_team_role_data
from app.sync.audience import church_member_user_ids
from app.sync.publish import publish

router = APIRouter()


@router.post(
    "/ministries/{event_ministry_id}/teams",
    operation_id="scheduleCampusEventTeam",
    status_code=status.HTTP_201_CREATED,
)
def schedule_team(
    event_ministry_id: UUID,
    payload: ScheduleTeamRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> ScheduledTeamResponse:
    event_ministry = db.get(CampusEventMinistry, event_ministry_id)
    if event_ministry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    get_church_membership_or_404(event_ministry.event.church_id, user=user, db=db)
    team = db.get(Team, payload.team_id)
    if team is None or team.ministry_id != event_ministry.ministry_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    if any(planned_team.team_id == team.id for planned_team in event_ministry.teams):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT)
    event_team = CampusEventTeam(
        campus_event_ministry_id=event_ministry.id,
        team_id=team.id,
        call_time=payload.call_time,
        notes=payload.notes,
    )
    db.add(event_team)
    db.flush()
    db.refresh(event_team)
    response = publish(
        ScheduledTeamResponse(
            sync_recipient_ids=church_member_user_ids(
                db, event_ministry.event.church_id
            ),
            id=event_team.id,
            team_id=event_team.team_id,
            call_time=event_team.call_time,
            notes=event_team.notes,
            confirmed_at=event_team.confirmed_at,
            is_fully_staffed=event_team.is_fully_staffed,
            roles=TeamRoleResponseData.from_role_data(event_team.role_data),
        ),
        tags=("campus-events", "campus-event-planning"),
        session=db,
    )
    db.commit()
    return response


@router.patch(
    "/{event_team_id}/roles",
    operation_id="updateCampusEventTeamRoleRequirements",
)
def update_team_role_requirements(
    event_team_id: UUID,
    payload: UpdateTeamRoleRequirementsRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> ScheduledTeamResponse:
    event_team = db.get(CampusEventTeam, event_team_id)
    if event_team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    get_church_membership_or_404(
        event_team.event_ministry.event.church_id, user=user, db=db
    )

    for assignment in event_team.volunteers:
        role = payload.roles.root.get(assignment.role_name or "")
        if role is None:
            assignment.role_name = None
            assignment.role_emoji = None
        else:
            assignment.role_emoji = role.emoji

    event_team.roles = build_team_role_data(
        payload.roles,
        [
            RoleAssignment(
                role_name=assignment.role_name,
                user_id=assignment.team_membership.church_membership.user_id,
            )
            for assignment in event_team.volunteers
        ],
    ).model_dump(mode="json")
    db.add(event_team)
    db.flush()
    db.refresh(event_team)
    response = publish(
        ScheduledTeamResponse(
            sync_recipient_ids=church_member_user_ids(
                db, event_team.event_ministry.event.church_id
            ),
            id=event_team.id,
            team_id=event_team.team_id,
            call_time=event_team.call_time,
            notes=event_team.notes,
            confirmed_at=event_team.confirmed_at,
            is_fully_staffed=event_team.is_fully_staffed,
            roles=TeamRoleResponseData.from_role_data(event_team.role_data),
        ),
        tags=("campus-events", "campus-event-planning"),
        session=db,
    )
    db.commit()
    return response
