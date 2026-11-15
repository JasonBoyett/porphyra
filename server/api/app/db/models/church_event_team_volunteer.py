from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.church_event_team import ChurchEventTeam
    from app.db.models.team_membership import TeamMembership


class ChurchEventTeamVolunteer(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_event_team_id", "team_membership_id"),)

    church_event_team_id: UUID = typed_field(foreign_key="churcheventteam.id")
    team_membership_id: UUID = typed_field(foreign_key="teammembership.id")
    event_team: "ChurchEventTeam" = typed_relationship(back_populates="volunteers")
    team_membership: "TeamMembership" = typed_relationship(
        back_populates="church_event_volunteer_assignments"
    )
