from collections.abc import Sequence
from typing import TYPE_CHECKING

from app.db.models.event_base import _EventBase, _EventTeamBase
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.church import Church
    from app.db.models.church_event_ministry import ChurchEventMinistry


class ChurchEvent(_EventBase, table=True):
	church: "Church" = typed_relationship(back_populates="church_events")
	ministries: list["ChurchEventMinistry"] = typed_relationship(
		back_populates="event",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)

	@property
	def _planned_teams(self) -> Sequence[_EventTeamBase]:
		return [team for ministry in self.ministries for team in ministry.teams]
