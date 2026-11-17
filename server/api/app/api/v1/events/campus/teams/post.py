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
from app.db.models import (
    CampusEventMinistry,
    CampusEventTeam,
    Team,
    VolunteerRequest,
    VolunteerRequestStatus,
)
from app.scheduling.roles import RoleAssignment, build_team_role_data
from app.sync.audience import church_member_user_ids
from app.sync.openapi import sync_tags
from app.sync.publish import publish

router = APIRouter()


@router.post(
    "/ministries/{event_ministry_id}/teams",
    operation_id="scheduleCampusEventTeam",
    status_code=status.HTTP_201_CREATED,
    openapi_extra=sync_tags("campus-events", "campus-event-planning"),
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
    openapi_extra=sync_tags("campus-events", "campus-event-planning"),
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

    call_time = (
        payload.call_time
        if "call_time" in payload.model_fields_set
        else event_team.call_time
    )
    call_time_changed = event_team.call_time != call_time
    actions = {action.assignment_id: action for action in payload.affected_volunteers}
    affected_assignments = [
        assignment
        for assignment in event_team.volunteers
        if call_time_changed or assignment.role_name not in payload.roles.root
    ]
    missing_actions = [
        assignment.id
        for assignment in affected_assignments
        if assignment.id not in actions
    ]
    if missing_actions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Choose whether to drop or reassign every affected volunteer.",
        )

    for assignment in affected_assignments:
        action = actions[assignment.id]
        if action.action not in {"drop", "reassign"}:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
        if action.action == "reassign" and action.role_name not in payload.roles.root:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Reassigned volunteers must use a configured role.",
            )

    retained_assignments = [
        assignment
        for assignment in event_team.volunteers
        if assignment not in affected_assignments
    ]
    for assignment in retained_assignments:
        role = payload.roles.root[assignment.role_name or ""]
        assignment.role_emoji = role.emoji

    role_data = build_team_role_data(
        payload.roles,
        [
            RoleAssignment(
                role_name=assignment.role_name,
                user_id=assignment.team_membership.church_membership.user_id,
            )
            for assignment in retained_assignments
        ],
    )
    if any(
        len(role.scheduled_users) > role.count for role in role_data.root.values()
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A role cannot require fewer volunteers than are currently assigned."
            ),
        )
    reserved_roles = {
        role_name: len(role.scheduled_users)
        + sum(
            request.status == VolunteerRequestStatus.PENDING
            and request.role_name == role_name
            for request in event_team.volunteer_requests
        )
        for role_name, role in role_data.root.items()
    }
    for assignment in affected_assignments:
        action = actions[assignment.id]
        if action.action != "reassign":
            continue
        role_name = action.role_name or ""
        if reserved_roles[role_name] >= role_data.root[role_name].count:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The selected role has no remaining openings.",
            )
        reserved_roles[role_name] += 1

    event_team.roles = role_data.model_dump(mode="json")
    event_team.call_time = call_time
    if call_time_changed:
        event_team.confirmed_at = None
        event_team.confirmed_by_team_membership_id = None

    for assignment in affected_assignments:
        action = actions[assignment.id]
        if action.action == "reassign":
            role = payload.roles.root[action.role_name or ""]
            request = VolunteerRequest(
                campus_event_team_id=event_team.id,
                team_membership_id=assignment.team_membership_id,
                role_name=action.role_name,
                role_emoji=role.emoji,
            )
            db.add(request)
        db.delete(assignment)

    for request in event_team.volunteer_requests:
        if (
            request.status == VolunteerRequestStatus.PENDING
            and request.role_name not in payload.roles.root
        ):
            request.status = VolunteerRequestStatus.RESOLVED
            db.add(request)

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
