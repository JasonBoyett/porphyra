from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    # This is type-only; SQLAlchemy resolves the relationship by model name.
    from app.db.models.church import Church


class Campus(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_id", "name"),)

    name: str
    city: str = typed_field(default="")

    church_id: UUID = typed_field(foreign_key="church.id")
    church: "Church" = typed_relationship(
        back_populates="campuses",
    )
