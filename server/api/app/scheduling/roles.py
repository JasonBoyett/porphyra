from collections.abc import Iterable
from uuid import UUID

from app.db.schemas import RoleTemplateData, TeamRoleData


class RoleAssignment:
	"""The role metadata needed to build an event team's JSON role snapshot."""

	def __init__(self, *, role_name: str | None, user_id: UUID) -> None:
		self.role_name = role_name
		self.user_id = user_id


def build_team_role_data(
	requirements: RoleTemplateData,
	assignments: Iterable[RoleAssignment],
) -> TeamRoleData:
	"""Copy requirements and attach only assignments that fill configured roles."""
	roles = {
		role_name: {
			"emoji": role.emoji,
			"count": role.count,
			"scheduled_users": [],
		}
		for role_name, role in requirements.root.items()
	}

	for assignment in assignments:
		if assignment.role_name in roles:
			roles[assignment.role_name]["scheduled_users"].append(assignment.user_id)

	return TeamRoleData.model_validate(roles)


def assign_user_to_role(
	roles: TeamRoleData,
	*,
	role_name: str | None,
	user_id: UUID,
) -> TeamRoleData:
	"""Move a user into one configured role, or remove their role assignment."""
	role_data = roles.model_copy(deep=True)
	for role in role_data.root.values():
		role.scheduled_users = [
			scheduled_user_id
			for scheduled_user_id in role.scheduled_users
			if scheduled_user_id != user_id
		]

	if role_name is not None:
		role = role_data.root.get(role_name)
		if role is None:
			raise ValueError("The selected role is not configured for this team.")
		role.scheduled_users.append(user_id)

	return TeamRoleData.model_validate(role_data)
