from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events.schemas import (
    ConfirmScheduleRequest,
    ScheduledTeamResponse,
    TeamRoleResponseData,
)
from app.auth import CurrentUser
from app.db.models import CampusEventTeam, TeamMembership
from app.db.utils import utc_now
from app.sync.audience import church_member_user_ids
from app.sync.publish import publish

router = APIRouter()


@router.post(
    "/{event_team_id}/confirmation",
    operation_id="confirmCampusEventTeam",
    openapi_extra={"x-sync-tags": ["campus-events", "campus-event-planning"]},
)
def confirm_schedule(
    event_team_id: UUID,
    payload: ConfirmScheduleRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> ScheduledTeamResponse:
    event_team = db.get(CampusEventTeam, event_team_id)
    if event_team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    get_church_membership_or_404(
        event_team.event_ministry.event.church_id, user=user, db=db
    )
    team_membership = db.get(TeamMembership, payload.team_membership_id)
    if team_membership is None or team_membership.team_id != event_team.team_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    if (
        team_membership.church_membership.church_id
        != event_team.event_ministry.event.church_id
    ):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    event_team.confirmed_at = utc_now()
    event_team.confirmed_by_team_membership_id = team_membership.id
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
