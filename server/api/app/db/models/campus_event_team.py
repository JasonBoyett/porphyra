from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.event_base import _EventTeamBase
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.campus_event_ministry import CampusEventMinistry
    from app.db.models.campus_event_team_volunteer import CampusEventTeamVolunteer
    from app.db.models.team import Team
    from app.db.models.team_membership import TeamMembership


class CampusEventTeam(_EventTeamBase, table=True):
    __table_args__ = (UniqueConstraint("campus_event_ministry_id", "team_id"),)

    campus_event_ministry_id: UUID = typed_field(foreign_key="campuseventministry.id")
    event_ministry: "CampusEventMinistry" = typed_relationship(back_populates="teams")
    team: "Team" = typed_relationship(back_populates="campus_event_teams")
    confirmed_by_team_membership: "TeamMembership" = typed_relationship(
        back_populates="confirmed_campus_event_teams"
    )
    volunteers: list["CampusEventTeamVolunteer"] = typed_relationship(
        back_populates="event_team",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
