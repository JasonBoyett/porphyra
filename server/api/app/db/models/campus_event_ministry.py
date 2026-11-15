from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.campus_event import CampusEvent
    from app.db.models.campus_event_team import CampusEventTeam
    from app.db.models.ministry import Ministry


class CampusEventMinistry(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("campus_event_id", "ministry_id"),)

    campus_event_id: UUID = typed_field(foreign_key="campusevent.id")
    ministry_id: UUID = typed_field(foreign_key="ministry.id")
    event: "CampusEvent" = typed_relationship(back_populates="ministries")
    ministry: "Ministry" = typed_relationship(back_populates="campus_event_ministries")
    teams: list["CampusEventTeam"] = typed_relationship(
        back_populates="event_ministry",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
