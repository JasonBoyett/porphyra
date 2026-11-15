from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.campus_event_team import CampusEventTeam
    from app.db.models.church_event_team import ChurchEventTeam
    from app.db.models.ministry import Ministry
    from app.db.models.team_membership import TeamMembership


class Team(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("ministry_id", "name"),)

    name: str
    ministry_id: UUID = typed_field(foreign_key="ministry.id")
    ministry: "Ministry" = typed_relationship(back_populates="teams")
    memberships: list["TeamMembership"] = typed_relationship(
        back_populates="team",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    campus_event_teams: list["CampusEventTeam"] = typed_relationship(
        back_populates="team",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    church_event_teams: list["ChurchEventTeam"] = typed_relationship(
        back_populates="team",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
