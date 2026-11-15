from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.event_base import _EventTeamBase
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	from app.db.models.church_event_ministry import ChurchEventMinistry
	from app.db.models.church_event_team_volunteer import ChurchEventTeamVolunteer
	from app.db.models.team import Team
	from app.db.models.team_membership import TeamMembership


class ChurchEventTeam(_EventTeamBase, table=True):
	__table_args__ = (UniqueConstraint("church_event_ministry_id", "team_id"),)  # pyright: ignore[reportUnannotatedClassAttribute]

	church_event_ministry_id: UUID = typed_field(foreign_key="churcheventministry.id")
	event_ministry: "ChurchEventMinistry" = typed_relationship(back_populates="teams")
	team: "Team" = typed_relationship(back_populates="church_event_teams")
	confirmed_by_team_membership: "TeamMembership" = typed_relationship(
		back_populates="confirmed_church_event_teams"
	)
	volunteers: list["ChurchEventTeamVolunteer"] = typed_relationship(
		back_populates="event_team",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)
