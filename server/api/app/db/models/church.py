from typing import TYPE_CHECKING

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    # This is type-only; SQLAlchemy resolves the relationship by model name.
    from app.db.models.campus import Campus
    from app.db.models.church_membership import ChurchMembership
    from app.db.models.ministry import Ministry


class Church(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("name"),)

    name: str
    description: str = typed_field(default="")
    campuses: list["Campus"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    memberships: list["ChurchMembership"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    ministries: list["Ministry"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
