from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.church_membership import ChurchMembership
    from app.db.models.team import Team


class TeamMembership(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_membership_id", "team_id"),)

    church_membership_id: UUID = typed_field(foreign_key="churchmembership.id")
    team_id: UUID = typed_field(foreign_key="team.id")
    notes: list[str] = typed_field(default_factory=list, sa_type=JSON, nullable=False)
    church_membership: "ChurchMembership" = typed_relationship(
        back_populates="team_memberships"
    )
    team: "Team" = typed_relationship(back_populates="memberships")
