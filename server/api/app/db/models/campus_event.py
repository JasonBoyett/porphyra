from collections.abc import Sequence
from typing import TYPE_CHECKING
from uuid import UUID

from app.db.field import typed_field
from app.db.models.event_base import _EventBase, _EventTeamBase
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	from app.db.models.campus import Campus
	from app.db.models.campus_event_ministry import CampusEventMinistry
	from app.db.models.church import Church


class CampusEvent(_EventBase, table=True):
	campus_id: UUID = typed_field(foreign_key="campus.id")
	church: "Church" = typed_relationship(back_populates="campus_events")
	campus: "Campus" = typed_relationship(back_populates="events")
	ministries: list["CampusEventMinistry"] = typed_relationship(
		back_populates="event",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)

	@property
	def _planned_teams(self) -> Sequence[_EventTeamBase]:
		return [team for ministry in self.ministries for team in ministry.teams]
