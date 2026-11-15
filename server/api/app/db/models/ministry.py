from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.campus_event_ministry import CampusEventMinistry
    from app.db.models.church import Church
    from app.db.models.church_event_ministry import ChurchEventMinistry
    from app.db.models.ministry_leadership import MinistryLeadership
    from app.db.models.team import Team


class Ministry(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_id", "name"),)

    name: str
    church_id: UUID = typed_field(foreign_key="church.id")
    church: "Church" = typed_relationship(back_populates="ministries")
    teams: list["Team"] = typed_relationship(
        back_populates="ministry",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    leaderships: list["MinistryLeadership"] = typed_relationship(
        back_populates="ministry",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    campus_event_ministries: list["CampusEventMinistry"] = typed_relationship(
        back_populates="ministry",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    church_event_ministries: list["ChurchEventMinistry"] = typed_relationship(
        back_populates="ministry",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
