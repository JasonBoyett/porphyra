from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	from app.db.models.campus_event_team import CampusEventTeam
	from app.db.models.campus_event_team_volunteer import CampusEventTeamVolunteer
	from app.db.models.church_event_team import ChurchEventTeam
	from app.db.models.church_event_team_volunteer import ChurchEventTeamVolunteer
	from app.db.models.church_membership import ChurchMembership
	from app.db.models.team import Team
	from app.db.models.volunteer_request import VolunteerRequest


class TeamMembership(DatabaseModel, table=True):
	__table_args__ = (UniqueConstraint("church_membership_id", "team_id"),)  # pyright: ignore[reportUnannotatedClassAttribute]

	church_membership_id: UUID = typed_field(foreign_key="churchmembership.id")
	team_id: UUID = typed_field(foreign_key="team.id")
	notes: list[str] = typed_field(default_factory=list, sa_type=JSON, nullable=False)
	church_membership: "ChurchMembership" = typed_relationship(
		back_populates="team_memberships"
	)
	team: "Team" = typed_relationship(back_populates="memberships")
	campus_event_volunteer_assignments: list["CampusEventTeamVolunteer"] = (
		typed_relationship(
			back_populates="team_membership",
			sa_relationship_kwargs={"cascade": "all, delete-orphan"},
		)
	)
	church_event_volunteer_assignments: list["ChurchEventTeamVolunteer"] = (
		typed_relationship(
			back_populates="team_membership",
			sa_relationship_kwargs={"cascade": "all, delete-orphan"},
		)
	)
	volunteer_requests: list["VolunteerRequest"] = typed_relationship(
		back_populates="team_membership",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)
	confirmed_campus_event_teams: list["CampusEventTeam"] = typed_relationship(
		back_populates="confirmed_by_team_membership"
	)
	confirmed_church_event_teams: list["ChurchEventTeam"] = typed_relationship(
		back_populates="confirmed_by_team_membership"
	)
