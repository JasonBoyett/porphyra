import json
from datetime import datetime
from pathlib import Path
from typing import Any, TypedDict

from sqlalchemy import or_
from sqlmodel import Session, select

from app.db.models import (
    Campus,
    CampusEvent,
    CampusEventMinistry,
    CampusEventTeam,
    CampusEventTeamVolunteer,
    Church,
    ChurchMembership,
    ChurchRole,
    ChurchRoleAssignment,
    ChurchRolePermission,
    Ministry,
    MinistryLeadership,
    Team,
    TeamMembership,
    User,
    VolunteerRequest,
    VolunteerRequestStatus,
)
from app.db.schemas import RoleTemplateData
from app.permissions import ALL_PERMISSIONS
from app.scheduling.roles import RoleAssignment, build_team_role_data


def load_seed_data() -> dict[str, Any]:
    path = Path(__file__).with_name("data.json")
    return json.loads(path.read_text())


class _CampusLocationFields(TypedDict):
    address_line_1: str
    address_line_2: str | None
    city: str
    region: str
    postal_code: str
    country_code: str
    time_zone: str


def _campus_location_fields(campus_data: dict[str, Any]) -> _CampusLocationFields:
    location = campus_data["location"]
    return {
        "address_line_1": location["addressLine1"],
        "address_line_2": location.get("addressLine2"),
        "city": location["city"],
        "region": location["region"],
        "postal_code": location["postalCode"],
        "country_code": location["countryCode"],
        "time_zone": location["timeZone"],
    }


def seed_database(db: Session) -> None:
    """Create the development data set without duplicating existing records."""
    data = load_seed_data()
    development_user = data["developmentUser"]
    user = db.exec(
        select(User).where(
            or_(
                User.auth_id == development_user["authId"],
                User.email == development_user["email"],
            )
        )
    ).one_or_none()
    if user is None:
        user = User(
            auth_id=development_user["authId"],
            email=development_user["email"],
            name=development_user["name"],
        )
        db.add(user)
        db.flush()
    else:
        user.auth_id = development_user["authId"]
        user.name = development_user["name"]

    for church_data in data["churches"]:
        church = db.exec(
            select(Church).where(Church.name == church_data["name"])
        ).one_or_none()
        if church is None:
            church = Church(
                name=church_data["name"],
                description=church_data["description"],
                campuses=[
                    Campus(
                        name=campus_data["name"],
                        **_campus_location_fields(campus_data),
                    )
                    for campus_data in church_data["campuses"]
                ],
            )
            db.add(church)
            db.flush()
        else:
            church.description = church_data["description"]

        membership = db.exec(
            select(ChurchMembership).where(
                ChurchMembership.user_id == user.id,
                ChurchMembership.church_id == church.id,
            )
        ).one_or_none()
        if membership is None:
            membership = ChurchMembership(user_id=user.id, church_id=church.id)
            db.add(membership)
            db.flush()

        # Every church begins with a top-level administrator. Future role-management
        # screens may add custom roles but must preserve at least one such assignment.
        assignment_table = ChurchRoleAssignment.__table__  # pyright: ignore[reportAttributeAccessIssue]
        administrator = db.exec(
            select(ChurchRole).where(
                ChurchRole.church_id == church.id,
                ChurchRole.name == "Administrator",
            )
        ).one_or_none()
        if administrator is None:
            administrator = ChurchRole(
                church_id=church.id,
                name="Administrator",
                is_administrator=True,
            )
            db.add(administrator)
            db.flush()
        if (
            db.exec(
                select(ChurchRoleAssignment).where(
                    ChurchRoleAssignment.church_membership_id == membership.id,
                    ChurchRoleAssignment.church_role_id == administrator.id,
                    assignment_table.c.campus_id.is_(None),
                )
            ).one_or_none()
            is None
        ):
            db.add(
                ChurchRoleAssignment(
                    church_membership_id=membership.id,
                    church_role_id=administrator.id,
                )
            )

        for campus_data in church_data["campuses"]:
            campus = db.exec(
                select(Campus).where(
                    Campus.church_id == church.id,
                    Campus.name == campus_data["name"],
                )
            ).one_or_none()
            if campus is None:
                db.add(
                    Campus(
                        church_id=church.id,
                        name=campus_data["name"],
                        **_campus_location_fields(campus_data),
                    )
                )
            else:
                for field_name, value in _campus_location_fields(campus_data).items():
                    setattr(campus, field_name, value)

        for ministry_data in church_data["ministries"]:
            ministry = db.exec(
                select(Ministry).where(
                    Ministry.church_id == church.id,
                    Ministry.name == ministry_data["name"],
                )
            ).one_or_none()
            if ministry is None:
                ministry = Ministry(church_id=church.id, name=ministry_data["name"])
                db.add(ministry)
                db.flush()

            leadership = db.exec(
                select(MinistryLeadership).where(
                    MinistryLeadership.church_membership_id == membership.id,
                    MinistryLeadership.ministry_id == ministry.id,
                )
            ).one_or_none()
            if leadership is None:
                db.add(
                    MinistryLeadership(
                        church_membership_id=membership.id,
                        ministry_id=ministry.id,
                    )
                )

            for team_name in ministry_data["teams"]:
                team = db.exec(
                    select(Team).where(
                        Team.ministry_id == ministry.id,
                        Team.name == team_name,
                    )
                ).one_or_none()
                if team is None:
                    team = Team(ministry_id=ministry.id, name=team_name)
                    db.add(team)
                    db.flush()

                team_membership = db.exec(
                    select(TeamMembership).where(
                        TeamMembership.church_membership_id == membership.id,
                        TeamMembership.team_id == team.id,
                    )
                ).one_or_none()
                if team_membership is None:
                    db.add(
                        TeamMembership(
                            church_membership_id=membership.id,
                            team_id=team.id,
                            notes=[],
                        )
                    )

        church_slug = "-".join(church.name.lower().split())
        church_teams = db.exec(
            select(Team)
            .join(Ministry)
            .where(Ministry.church_id == church.id)
            .order_by(Ministry.name, Team.name)
        ).all()
        for index, volunteer_name in enumerate(church_data.get("volunteers", [])):
            volunteer_slug = "-".join(volunteer_name.lower().split())
            volunteer_auth_id = f"seed:{church_slug}:{volunteer_slug}"
            volunteer_email = f"{volunteer_slug}@{church_slug}.test"
            volunteer = db.exec(
                select(User).where(User.auth_id == volunteer_auth_id)
            ).one_or_none()
            if volunteer is None:
                volunteer = User(
                    auth_id=volunteer_auth_id,
                    email=volunteer_email,
                    name=volunteer_name,
                )
                db.add(volunteer)
                db.flush()

            volunteer_membership = db.exec(
                select(ChurchMembership).where(
                    ChurchMembership.user_id == volunteer.id,
                    ChurchMembership.church_id == church.id,
                )
            ).one_or_none()
            if volunteer_membership is None:
                volunteer_membership = ChurchMembership(
                    user_id=volunteer.id,
                    church_id=church.id,
                )
                db.add(volunteer_membership)
                db.flush()

            team_indexes = [index % len(church_teams)]
            if index % 5 == 0 and len(church_teams) > 1:
                team_indexes.append((index + 1) % len(church_teams))
            for team_index in team_indexes:
                team = church_teams[team_index]
                team_membership = db.exec(
                    select(TeamMembership).where(
                        TeamMembership.church_membership_id == volunteer_membership.id,
                        TeamMembership.team_id == team.id,
                    )
                ).one_or_none()
                if team_membership is None:
                    db.add(
                        TeamMembership(
                            church_membership_id=volunteer_membership.id,
                            team_id=team.id,
                            notes=[],
                        )
                    )

        for role_data in church_data.get("roles", []):
            role = db.exec(
                select(ChurchRole).where(
                    ChurchRole.church_id == church.id,
                    ChurchRole.name == role_data["name"],
                )
            ).one_or_none()
            if role is None:
                role = ChurchRole(
                    church_id=church.id,
                    name=role_data["name"],
                    is_administrator=role_data.get("isAdministrator", False),
                )
                db.add(role)
                db.flush()
            for permission in role_data.get("permissions", []):
                if permission not in ALL_PERMISSIONS:
                    raise ValueError(f"Unknown seed permission: {permission}")
                existing_permission = db.exec(
                    select(ChurchRolePermission).where(
                        ChurchRolePermission.church_role_id == role.id,
                        ChurchRolePermission.permission == permission,
                    )
                ).one_or_none()
                if existing_permission is None:
                    db.add(
                        ChurchRolePermission(
                            church_role_id=role.id,
                            permission=permission,
                        )
                    )
            for assignment_data in role_data.get("assignments", []):
                assigned_user = db.exec(
                    select(User).where(User.name == assignment_data["member"])
                ).one()
                assigned_membership = db.exec(
                    select(ChurchMembership).where(
                        ChurchMembership.user_id == assigned_user.id,
                        ChurchMembership.church_id == church.id,
                    )
                ).one()
                campus = db.exec(
                    select(Campus).where(
                        Campus.church_id == church.id,
                        Campus.name == assignment_data["campus"],
                    )
                ).one()
                team_name = assignment_data.get("team")
                team = (
                    db.exec(
                        select(Team)
                        .join(Ministry)
                        .where(
                            Ministry.church_id == church.id,
                            Team.name == team_name,
                        )
                    ).one()
                    if team_name is not None
                    else None
                )
                existing_assignment = db.exec(
                    select(ChurchRoleAssignment).where(
                        ChurchRoleAssignment.church_membership_id
                        == assigned_membership.id,
                        ChurchRoleAssignment.church_role_id == role.id,
                        ChurchRoleAssignment.campus_id == campus.id,
                        ChurchRoleAssignment.team_id == (team.id if team else None),
                    )
                ).one_or_none()
                if existing_assignment is None:
                    db.add(
                        ChurchRoleAssignment(
                            church_membership_id=assigned_membership.id,
                            church_role_id=role.id,
                            campus_id=campus.id,
                            team_id=team.id if team else None,
                        )
                    )

        for event_data in church_data.get("campusEvents", []):
            campus = db.exec(
                select(Campus).where(
                    Campus.church_id == church.id,
                    Campus.name == event_data["campus"],
                )
            ).one()
            event = db.exec(
                select(CampusEvent).where(
                    CampusEvent.campus_id == campus.id,
                    CampusEvent.title == event_data["title"],
                )
            ).one_or_none()
            if event is None:
                event = CampusEvent(
                    church_id=church.id,
                    campus_id=campus.id,
                    title=event_data["title"],
                    description=event_data["description"],
                    starts_at=datetime.fromisoformat(event_data["startsAt"]),
                    ends_at=datetime.fromisoformat(event_data["endsAt"]),
                )
                db.add(event)
                db.flush()
            else:
                event.description = event_data["description"]
                event.starts_at = datetime.fromisoformat(event_data["startsAt"])
                event.ends_at = datetime.fromisoformat(event_data["endsAt"])

            for event_ministry_data in event_data["ministries"]:
                ministry = db.exec(
                    select(Ministry).where(
                        Ministry.church_id == church.id,
                        Ministry.name == event_ministry_data["name"],
                    )
                ).one()
                event_ministry = db.exec(
                    select(CampusEventMinistry).where(
                        CampusEventMinistry.campus_event_id == event.id,
                        CampusEventMinistry.ministry_id == ministry.id,
                    )
                ).one_or_none()
                if event_ministry is None:
                    event_ministry = CampusEventMinistry(
                        campus_event_id=event.id,
                        ministry_id=ministry.id,
                    )
                    db.add(event_ministry)
                    db.flush()

                for event_team_data in event_ministry_data["teams"]:
                    role_requirements = RoleTemplateData.model_validate(
                        event_team_data.get("roles", {})
                    )
                    team = db.exec(
                        select(Team).where(
                            Team.ministry_id == ministry.id,
                            Team.name == event_team_data["name"],
                        )
                    ).one()
                    event_team = db.exec(
                        select(CampusEventTeam).where(
                            CampusEventTeam.campus_event_ministry_id
                            == event_ministry.id,
                            CampusEventTeam.team_id == team.id,
                        )
                    ).one_or_none()
                    call_time_data = event_team_data["callTime"]
                    call_time = (
                        datetime.fromisoformat(call_time_data)
                        if call_time_data is not None
                        else None
                    )
                    if event_team is None:
                        event_team = CampusEventTeam(
                            campus_event_ministry_id=event_ministry.id,
                            team_id=team.id,
                            call_time=call_time,
                            notes=event_team_data["notes"],
                        )
                        db.add(event_team)
                        db.flush()
                    else:
                        event_team.call_time = call_time
                        event_team.notes = event_team_data["notes"]

                    if event_team_data.get("assignDevelopmentUser", False):
                        event_team_membership = db.exec(
                            select(TeamMembership).where(
                                TeamMembership.church_membership_id == membership.id,
                                TeamMembership.team_id == team.id,
                            )
                        ).one()
                        assignment = db.exec(
                            select(CampusEventTeamVolunteer).where(
                                CampusEventTeamVolunteer.campus_event_team_id
                                == event_team.id,
                                CampusEventTeamVolunteer.team_membership_id
                                == event_team_membership.id,
                            )
                        ).one_or_none()
                        if assignment is None:
                            assignment = CampusEventTeamVolunteer(
                                campus_event_team_id=event_team.id,
                                team_membership_id=event_team_membership.id,
                            )
                            db.add(assignment)
                        role_name = event_team_data.get("assignDevelopmentUserRole")
                        if role_name is not None:
                            assignment.role_name = role_name
                            assignment.role_emoji = role_requirements.root[
                                role_name
                            ].emoji

                    requests_by_seed_id: dict[str, VolunteerRequest] = {}
                    for request_data in event_team_data.get("volunteerRequests", []):
                        volunteer = db.exec(
                            select(User).where(User.name == request_data["volunteer"])
                        ).one()
                        request_membership = db.exec(
                            select(TeamMembership).where(
                                TeamMembership.church_membership_id
                                == volunteer.memberships[0].id,
                                TeamMembership.team_id == team.id,
                            )
                        ).one()
                        role_name = request_data["role"]
                        replaces = request_data.get("replaces")
                        if replaces is None:
                            request_query = select(VolunteerRequest).where(
                                VolunteerRequest.campus_event_team_id == event_team.id,
                                VolunteerRequest.team_membership_id
                                == request_membership.id,
                                VolunteerRequest.role_name == role_name,
                                VolunteerRequest.status
                                == VolunteerRequestStatus(request_data["status"]),
                                VolunteerRequest.replacing_id == None,  # noqa: E711
                            )
                        else:
                            request_query = select(VolunteerRequest).where(
                                VolunteerRequest.replacing_id
                                == requests_by_seed_id[replaces].id
                            )
                        request = db.exec(request_query).first()
                        if request is None:
                            request = VolunteerRequest(
                                campus_event_team_id=event_team.id,
                                team_membership_id=request_membership.id,
                                role_name=role_name,
                                role_emoji=role_requirements.root[role_name].emoji,
                                status=VolunteerRequestStatus(request_data["status"]),
                                replacing_id=(
                                    requests_by_seed_id[replaces].id
                                    if replaces is not None
                                    else None
                                ),
                            )
                            db.add(request)
                            db.flush()
                        requests_by_seed_id[request_data["id"]] = request

                    db.flush()
                    event_team.roles = build_team_role_data(
                        role_requirements,
                        [
                            RoleAssignment(
                                role_name=assignment.role_name,
                                user_id=assignment.team_membership.church_membership.user_id,
                            )
                            for assignment in event_team.volunteers
                        ],
                    ).model_dump(mode="json")
                    seed_requests = db.exec(
                        select(VolunteerRequest).where(
                            VolunteerRequest.campus_event_team_id == event_team.id
                        )
                    ).all()
                    replaced_request_ids = {
                        request.replacing_id
                        for request in seed_requests
                        if request.replacing_id is not None
                    }
                    for request in seed_requests:
                        role = (
                            event_team.role_data.root[request.role_name]
                            if request.role_name is not None
                            else None
                        )
                        if (
                            request.id not in replaced_request_ids
                            and request.status == VolunteerRequestStatus.PENDING
                            and role is not None
                            and len(role.scheduled_users) >= role.count
                        ):
                            request.status = VolunteerRequestStatus.RESOLVED
                            db.add(request)

    db.commit()
