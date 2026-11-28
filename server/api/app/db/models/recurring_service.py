from datetime import time
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Time, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.campus import Campus


class RecurringService(DatabaseModel, table=True):
    """A weekly service expressed in the campus's local wall-clock time."""

    __table_args__ = (UniqueConstraint("campus_id", "name", "weekday", "starts_at"),)

    campus_id: UUID = typed_field(foreign_key="campus.id")
    name: str
    weekday: int
    starts_at: time = typed_field(sa_type=Time())
    duration_minutes: int | None = typed_field(default=None, nullable=True)
    campus: "Campus" = typed_relationship(back_populates="recurring_services")
