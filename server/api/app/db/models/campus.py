from enum import StrEnum
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
    from app.db.models.recurring_service import RecurringService
    from app.db.models.role_template import CampusRoleTemplate


class CampusType(StrEnum):
    PHYSICAL = "physical"
    ONLINE = "online"
    ADMINISTRATIVE = "administrative"
    MINISTRY_CENTER = "ministry_center"


class Campus(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_id", "name"),)

    name: str
    campus_type: CampusType = typed_field(default=CampusType.PHYSICAL, nullable=False)
    address_line_1: str | None = typed_field(default=None, nullable=True)
    address_line_2: str | None = typed_field(default=None, nullable=True)
    city: str | None = typed_field(default=None, nullable=True)
    region: str | None = typed_field(default=None, nullable=True)
    postal_code: str | None = typed_field(default=None, nullable=True)
    country_code: str | None = typed_field(default=None, nullable=True)
    time_zone: str = typed_field(default="America/Chicago")

    church_id: UUID = typed_field(foreign_key="church.id")
    church: "Church" = typed_relationship(
        back_populates="campuses",
        sa_relationship_kwargs={"foreign_keys": "Campus.church_id"},
    )
    recurring_services: list["RecurringService"] = typed_relationship(
        back_populates="campus",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    events: list["CampusEvent"] = typed_relationship(
        back_populates="campus",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    role_templates: list["CampusRoleTemplate"] = typed_relationship(
        back_populates="campus",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
