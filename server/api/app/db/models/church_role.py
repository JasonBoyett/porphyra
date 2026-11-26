from __future__ import annotations

from uuid import UUID

from sqlalchemy import CheckConstraint, UniqueConstraint

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel


class ChurchRole(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_id", "name"),)

    church_id: UUID = typed_field(foreign_key="church.id")
    name: str
    is_administrator: bool = typed_field(default=False, nullable=False)


class ChurchRolePermission(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("church_role_id", "permission"),)

    church_role_id: UUID = typed_field(foreign_key="churchrole.id")
    permission: str


class ChurchRoleAssignment(DatabaseModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "church_membership_id", "church_role_id", "campus_id", "team_id"
        ),
        CheckConstraint(
            "team_id IS NULL OR campus_id IS NOT NULL",
            name="team_assignment_requires_campus",
        ),
    )

    church_membership_id: UUID = typed_field(foreign_key="churchmembership.id")
    church_role_id: UUID = typed_field(foreign_key="churchrole.id")
    campus_id: UUID | None = typed_field(
        foreign_key="campus.id", default=None, nullable=True
    )
    team_id: UUID | None = typed_field(
        foreign_key="team.id", default=None, nullable=True
    )
