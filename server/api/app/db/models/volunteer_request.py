from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint
from sqlmodel import Session, select

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	from app.db.models.campus_event_team import CampusEventTeam
	from app.db.models.team_membership import TeamMembership


class VolunteerRequestStatus(StrEnum):
	PENDING = "pending"
	ACCEPTED = "accepted"
	REJECTED = "rejected"
	REJECTED_RESOLVED = "rejected_resolved"
	RESOLVED = "resolved"
	DROPED = "dropped"


class VolunteerRequest(DatabaseModel, table=True):
	"""A volunteer's place in an event-team roster, including replacements."""

	__table_args__ = (UniqueConstraint("replacing_id"),)

	campus_event_team_id: UUID = typed_field(foreign_key="campuseventteam.id")
	team_membership_id: UUID = typed_field(foreign_key="teammembership.id")
	role_name: str | None = typed_field(default=None, nullable=True)
	role_emoji: str | None = typed_field(default=None, nullable=True)
	status: VolunteerRequestStatus = typed_field(default=VolunteerRequestStatus.PENDING)
	replacing_id: UUID | None = typed_field(
		default=None,
		foreign_key="volunteerrequest.id",
		nullable=True,
	)

	event_team: "CampusEventTeam" = typed_relationship(
		back_populates="volunteer_requests"
	)
	team_membership: "TeamMembership" = typed_relationship(
		back_populates="volunteer_requests"
	)

	def rejected_ancestors(self, db: Session) -> list["VolunteerRequest"]:
		"""Return the rejected requests this request replaces, oldest first.

		Every hop is looked up through SQL so this remains correct for chains
		loaded without ORM relationships. Invalid chains are rejected rather than
		silently resolving a request from another roster or role.
		"""
		ancestors: list["VolunteerRequest"] = []
		seen = {self.id}
		current = self
		while current.replacing_id is not None:
			parent = db.exec(
				select(VolunteerRequest).where(
					VolunteerRequest.id == current.replacing_id
				)
			).one_or_none()
			if parent is None:
				raise ValueError("The replacement request does not exist.")
			if parent.id in seen:
				raise ValueError("The replacement chain contains a cycle.")
			if (
				parent.campus_event_team_id != self.campus_event_team_id
				or parent.role_name != self.role_name
			):
				raise ValueError(
					"Replacement requests must belong to the same team and role."
				)
			if parent.status != VolunteerRequestStatus.REJECTED:
				raise ValueError("Only rejected requests can be replaced.")
			seen.add(parent.id)
			ancestors.append(parent)
			current = parent
		return list(reversed(ancestors))
