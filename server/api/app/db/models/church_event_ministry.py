from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.church_event import ChurchEvent
    from app.db.models.church_event_team import ChurchEventTeam
    from app.db.models.ministry import Ministry


class ChurchEventMinistry(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_event_id", "ministry_id"),)

    church_event_id: UUID = typed_field(foreign_key="churchevent.id")
    ministry_id: UUID = typed_field(foreign_key="ministry.id")
    event: "ChurchEvent" = typed_relationship(back_populates="ministries")
    ministry: "Ministry" = typed_relationship(back_populates="church_event_ministries")
    teams: list["ChurchEventTeam"] = typed_relationship(
        back_populates="event_ministry",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
