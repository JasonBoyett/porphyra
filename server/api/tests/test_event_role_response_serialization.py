from datetime import datetime, timezone
from uuid import uuid4

from app.api.v1.campuses.schemas import CampusLocationResponse
from app.api.v1.events.schemas import (
    CampusEventMinistryScheduleResponse,
    CampusEventPlanningResponse,
    CampusEventTeamScheduleResponse,
    ScheduledTeamResponse,
    TeamRoleResponse,
    TeamRoleResponseData,
)
from app.db.schemas import TeamRoleData


def test_planning_response_camel_cases_nested_role_assignments() -> None:
    user_id = uuid4()
    roles = TeamRoleData.model_validate(
        {"Guitar": {"emoji": "🎸", "count": 2, "scheduled_users": [user_id]}}
    )
    response = CampusEventPlanningResponse(
        sync_recipient_ids=[],
        id=uuid4(),
        church_id=uuid4(),
        church_name="Church",
        campus_id=uuid4(),
        campus_name="Campus",
        campus_location=CampusLocationResponse(
            address_line_1="123 Main Street",
            address_line_2=None,
            city="Springfield",
            region="IL",
            postal_code="62701",
            country_code="US",
            time_zone="America/Chicago",
        ),
        title="Service",
        description="",
        starts_at=datetime.now(timezone.utc),
        ends_at=None,
        is_staffed=False,
        is_fully_staffed=False,
        teams_needing_confirmation=[],
        ministries=[
            CampusEventMinistryScheduleResponse(
                id=uuid4(),
                name="Music",
                teams=[
                    CampusEventTeamScheduleResponse(
                        id=uuid4(),
                        team_id=uuid4(),
                        name="Band",
                        call_time=None,
                        notes=[],
                        confirmed_at=None,
                        is_fully_staffed=False,
                        roles=TeamRoleResponseData.from_role_data(roles),
                        volunteers=[],
                        eligible_volunteers=[],
                    )
                ],
            )
        ],
    )

    role = response.model_dump(mode="json", by_alias=True)["ministries"][0]["teams"][0][
        "roles"
    ]["Guitar"]
    assert role["scheduledUsers"] == [str(user_id)]
    assert "scheduled_users" not in role


def test_sync_team_response_camel_cases_nested_role_assignments() -> None:
    user_id = uuid4()
    response = ScheduledTeamResponse(
        sync_recipient_ids=[],
        id=uuid4(),
        team_id=uuid4(),
        call_time=None,
        notes=[],
        confirmed_at=None,
        is_fully_staffed=False,
        roles=TeamRoleResponseData.from_role_data(
            TeamRoleData.model_validate(
                {"Guitar": {"emoji": None, "count": 1, "scheduled_users": [user_id]}}
            )
        ),
    )

    role = response.model_dump(mode="json", by_alias=True)["roles"]["Guitar"]
    assert role["scheduledUsers"] == [str(user_id)]
    assert "scheduled_users" not in role
    assert "scheduledUsers" in TeamRoleResponse.model_json_schema()["properties"]
