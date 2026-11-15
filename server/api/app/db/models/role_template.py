from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import JSON, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship
from app.db.schemas import RoleTemplateData

if TYPE_CHECKING:
	from app.db.models.campus import Campus
	from app.db.models.church import Church


class RoleTemplate(DatabaseModel):
	"""Shared persisted fields for reusable role-requirement templates."""

	name: str
	roles: dict[str, dict[str, Any]] = typed_field(
		default_factory=dict,
		sa_type=JSON,
		nullable=False,
	)

	@property
	def role_data(self) -> RoleTemplateData:
		return RoleTemplateData.model_validate(self.roles)


class PublicRoleTemplate(RoleTemplate, table=True):
	__table_args__ = (UniqueConstraint("name"),)


class ChurchRoleTemplate(RoleTemplate, table=True):
	__table_args__ = (UniqueConstraint("church_id", "name"),)

	church_id: UUID = typed_field(foreign_key="church.id")
	church: "Church" = typed_relationship(back_populates="role_templates")


class CampusRoleTemplate(RoleTemplate, table=True):
	__table_args__ = (UniqueConstraint("campus_id", "name"),)

	campus_id: UUID = typed_field(foreign_key="campus.id")
	campus: "Campus" = typed_relationship(back_populates="role_templates")
