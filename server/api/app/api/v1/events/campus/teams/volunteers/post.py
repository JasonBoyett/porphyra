from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events.schemas import (
    AssignVolunteerRequest,
    UpdateVolunteerRoleRequest,
    VolunteerAssignmentResponse,
)
from app.auth import CurrentUser
from app.db.models import CampusEventTeam, CampusEventTeamVolunteer, TeamMembership
from app.db.utils import utc_now
from app.scheduling.conflicts import get_schedule_conflicts
from app.scheduling.roles import assign_user_to_role
from app.sync.audience import church_member_user_ids
from app.sync.publish import publish
from app.sync.tags import SyncTag

router = APIRouter()


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
) -> VolunteerAssignmentResponse:
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
    if any(
        assignment.team_membership_id == team_membership.id
        for assignment in event_team.volunteers
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
    assignment = CampusEventTeamVolunteer(
        campus_event_team_id=event_team.id,
        team_membership_id=team_membership.id,
        conflict_confirmed_at=utc_now() if conflicts else None,
        conflict_confirmed_by_user_id=user.id if conflicts else None,
    )
    db.add(assignment)
    db.flush()
    db.refresh(assignment)
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
        tags=(SyncTag.CAMPUS_EVENTS, SyncTag.CAMPUS_EVENT_PLANNING),
        session=db,
    )
    db.commit()
    return response


@router.patch(
    "/{event_team_id}/volunteers/{assignment_id}",
    operation_id="updateCampusEventVolunteerRole",
)
def update_volunteer_role(
    event_team_id: UUID,
    assignment_id: UUID,
    payload: UpdateVolunteerRoleRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> VolunteerAssignmentResponse:
    event_team = db.get(CampusEventTeam, event_team_id)
    assignment = db.get(CampusEventTeamVolunteer, assignment_id)
    if event_team is None or assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if assignment.campus_event_team_id != event_team.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    get_church_membership_or_404(
        event_team.event_ministry.event.church_id, user=user, db=db
    )
    role_name = payload.role_name or None
    if event_team.roles:
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
    db.add(event_team)
    db.add(assignment)
    db.flush()
    db.refresh(assignment)
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
        tags=(SyncTag.CAMPUS_EVENTS, SyncTag.CAMPUS_EVENT_PLANNING),
        session=db,
    )
    db.commit()
    return response
