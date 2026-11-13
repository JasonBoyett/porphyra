from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.church_membership import ChurchMembership
    from app.db.models.ministry import Ministry


class MinistryLeadership(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_membership_id", "ministry_id"),)

    church_membership_id: UUID = typed_field(foreign_key="churchmembership.id")
    ministry_id: UUID = typed_field(foreign_key="ministry.id")
    church_membership: "ChurchMembership" = typed_relationship(
        back_populates="ministry_leaderships"
    )
    ministry: "Ministry" = typed_relationship(back_populates="leaderships")
