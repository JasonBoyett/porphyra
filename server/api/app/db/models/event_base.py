from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, DateTime

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.schemas import TeamRoleData


class _EventTeamBase(DatabaseModel):
	"""Private shared fields and readiness behavior for an event-specific team."""

	team_id: UUID = typed_field(foreign_key="team.id")
	call_time: datetime | None = typed_field(
		default=None,
		sa_type=DateTime(timezone=True),
		nullable=True,
	)
	notes: list[str] = typed_field(default_factory=list, sa_type=JSON, nullable=False)
	roles: dict[str, dict[str, object]] = typed_field(
		default_factory=dict,
		sa_type=JSON,
		nullable=False,
	)
	confirmed_at: datetime | None = typed_field(
		default=None,
		sa_type=DateTime(timezone=True),
		nullable=True,
	)
	confirmed_by_team_membership_id: UUID | None = typed_field(
		default=None,
		foreign_key="teammembership.id",
		nullable=True,
	)

	@property
	def is_schedule_confirmed(self) -> bool:
		return self.confirmed_at is not None

	@property
	def role_data(self) -> TeamRoleData:
		return TeamRoleData.model_validate(self.roles)

	@property
	def is_fully_staffed(self) -> bool:
		return self.role_data.is_staffed


class _EventBase(DatabaseModel):
	"""Private shared fields and readiness behavior for concrete event scopes."""

	church_id: UUID = typed_field(foreign_key="church.id")
	title: str
	description: str = typed_field(default="")
	starts_at: datetime = typed_field(sa_type=DateTime(timezone=True))
	ends_at: datetime | None = typed_field(
		default=None,
		sa_type=DateTime(timezone=True),
		nullable=True,
	)

	@property
	def _planned_teams(self) -> Sequence[_EventTeamBase]:
		raise NotImplementedError

	@property
	def teams_needing_confirmation(self) -> list[_EventTeamBase]:
		return [team for team in self._planned_teams if not team.is_schedule_confirmed]

	@property
	def is_staffed(self) -> bool:
		return bool(self._planned_teams) and not self.teams_needing_confirmation

	@property
	def is_fully_staffed(self) -> bool:
		return bool(self._planned_teams) and all(
			team.is_fully_staffed for team in self._planned_teams
		)
