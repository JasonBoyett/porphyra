from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship


class Invitation(DatabaseModel, table=True):
    church_id: UUID = typed_field(foreign_key="church.id")
    campus_id: UUID | None = typed_field(
        foreign_key="campus.id", default=None, nullable=True
    )
    creator_user_id: UUID = typed_field(foreign_key="user.id")
    token_hash: str = typed_field(index=True, unique=True)
    expires_at: datetime = typed_field(sa_type=DateTime(timezone=True))
    revoked_at: datetime | None = typed_field(
        default=None, sa_type=DateTime(timezone=True), nullable=True
    )
    redeemed_at: datetime | None = typed_field(
        default=None, sa_type=DateTime(timezone=True), nullable=True
    )
    claimed_by_user_id: UUID | None = typed_field(
        foreign_key="user.id", default=None, nullable=True
    )
    teams: list["InvitationTeam"] = typed_relationship(
        back_populates="invitation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    roles: list["InvitationRole"] = typed_relationship(
        back_populates="invitation",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class InvitationTeam(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("invitation_id", "team_id"),)

    invitation_id: UUID = typed_field(foreign_key="invitation.id")
    team_id: UUID = typed_field(foreign_key="team.id")
    invitation: Invitation = typed_relationship(back_populates="teams")


class InvitationRole(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("invitation_id", "church_role_id"),)

    invitation_id: UUID = typed_field(foreign_key="invitation.id")
    church_role_id: UUID = typed_field(foreign_key="churchrole.id")
    invitation: Invitation = typed_relationship(back_populates="roles")
