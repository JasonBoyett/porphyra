from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	# This is type-only; SQLAlchemy resolves the relationship by model name.
	from app.db.models.campus_event import CampusEvent
	from app.db.models.church import Church
	from app.db.models.role_template import CampusRoleTemplate


class Campus(DatabaseModel, table=True):
	__table_args__ = (UniqueConstraint("church_id", "name"),)

	name: str
	address_line_1: str = typed_field(default="")
	address_line_2: str | None = typed_field(default=None, nullable=True)
	city: str = typed_field(default="")
	region: str = typed_field(default="")
	postal_code: str = typed_field(default="")
	country_code: str = typed_field(default="")
	time_zone: str = typed_field(default="Etc/UTC")

	church_id: UUID = typed_field(foreign_key="church.id")
	church: "Church" = typed_relationship(
		back_populates="campuses",
	)
	events: list["CampusEvent"] = typed_relationship(
		back_populates="campus",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)
	role_templates: list["CampusRoleTemplate"] = typed_relationship(
		back_populates="campus",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)
