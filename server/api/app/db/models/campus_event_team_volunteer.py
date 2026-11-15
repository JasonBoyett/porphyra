from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	from app.db.models.campus_event_team import CampusEventTeam
	from app.db.models.team_membership import TeamMembership


class CampusEventTeamVolunteer(DatabaseModel, table=True):
	__table_args__ = (UniqueConstraint("campus_event_team_id", "team_membership_id"),)

	campus_event_team_id: UUID = typed_field(foreign_key="campuseventteam.id")
	team_membership_id: UUID = typed_field(foreign_key="teammembership.id")
	role_name: str | None = typed_field(default=None, nullable=True)
	role_emoji: str | None = typed_field(default=None, nullable=True)
	conflict_confirmed_at: datetime | None = typed_field(
		default=None,
		sa_type=DateTime(timezone=True),
		nullable=True,
	)
	conflict_confirmed_by_user_id: UUID | None = typed_field(
		default=None,
		foreign_key="user.id",
		nullable=True,
	)
	event_team: "CampusEventTeam" = typed_relationship(back_populates="volunteers")
	team_membership: "TeamMembership" = typed_relationship(
		back_populates="campus_event_volunteer_assignments"
	)
