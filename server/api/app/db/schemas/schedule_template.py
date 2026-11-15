from uuid import UUID

from pydantic import BaseModel, Field, RootModel, model_validator


class _RoleInfoForTemplate(BaseModel):
	"""A role requirement that can be copied into an event team."""

	emoji: str | None = Field(default=None, max_length=16)
	count: int = Field(ge=1)


class RoleInfoForTeamJson(_RoleInfoForTemplate):
	"""An event-specific role requirement and the users assigned to it."""

	scheduled_users: list[UUID] = Field(default_factory=list)

	@property
	def is_staffed(self) -> bool:
		return len(self.scheduled_users) >= self.count


class RoleTemplateData(RootModel[dict[str, _RoleInfoForTemplate]]):
	"""Reusable requirements keyed by their human-readable role name."""

	@model_validator(mode="after")
	def _validate_role_names(self) -> "RoleTemplateData":
		if any(not role_name.strip() for role_name in self.root):
			raise ValueError("Role names must not be blank.")
		return self


class TeamRoleData(RootModel[dict[str, RoleInfoForTeamJson]]):
	"""The independently editable role snapshot for one event team."""

	@model_validator(mode="after")
	def _validate_scheduled_users(self) -> "TeamRoleData":
		role_names = self.root
		if any(not role_name.strip() for role_name in role_names):
			raise ValueError("Role names must not be blank.")

		scheduled_users = [
			user_id
			for role in role_names.values()
			for user_id in role.scheduled_users
		]
		if len(scheduled_users) != len(set(scheduled_users)):
			raise ValueError("A user may only fill one role on an event team.")
		return self

	@property
	def is_staffed(self) -> bool:
		return bool(self.root) and all(role.is_staffed for role in self.root.values())
