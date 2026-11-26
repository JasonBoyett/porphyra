"""Scoped, server-authoritative permission evaluation."""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, get_args
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, exists, or_
from sqlmodel import Session, select

from app.db.models.church_role import (
    ChurchRole,
    ChurchRoleAssignment,
    ChurchRolePermission,
)

if TYPE_CHECKING:
    from app.db.models.church_membership import ChurchMembership

Permission = Literal[
    "events.manage",
    "schedule.manage",
    "roles.manage",
    "volunteer.respond",
]

ALL_PERMISSIONS = frozenset(get_args(Permission))


def action_is_permitted(
    membership: ChurchMembership,
    db: Session,
    *,
    action: Permission,
    church_id: UUID,
    campus_id: UUID | None = None,
    team_id: UUID | None = None,
) -> bool:
    """Return whether a membership has an action at this point in the scope tree.

    The EXISTS query deliberately keeps role expansion in SQLite. The caller supplies
    the level from a resource it loaded, never from untrusted request input.
    """
    if membership.church_id != church_id:
        return False
    assignments = ChurchRoleAssignment.__table__.c  # pyright: ignore[reportAttributeAccessIssue]
    roles = ChurchRole.__table__.c  # pyright: ignore[reportAttributeAccessIssue]
    role_permissions = ChurchRolePermission.__table__.c  # pyright: ignore[reportAttributeAccessIssue]
    applicable_scope = and_(
        assignments.church_membership_id == membership.id,
        or_(
            assignments.campus_id.is_(None),
            assignments.campus_id == campus_id,
        ),
        or_(
            assignments.team_id.is_(None),
            and_(
                assignments.campus_id == campus_id,
                assignments.team_id == team_id,
            ),
        ),
    )
    statement = select(
        exists().where(
            applicable_scope,
            roles.id == assignments.church_role_id,
            roles.church_id == church_id,
            or_(
                roles.is_administrator.is_(True),
                exists().where(
                    role_permissions.church_role_id == roles.id,
                    role_permissions.permission == action,
                ),
            ),
        )
    )
    return bool(db.exec(statement).one())


def require_action(
    membership: ChurchMembership,
    db: Session,
    *,
    action: Permission,
    church_id: UUID,
    campus_id: UUID | None = None,
    team_id: UUID | None = None,
) -> None:
    if not action_is_permitted(
        membership,
        db,
        action=action,
        church_id=church_id,
        campus_id=campus_id,
        team_id=team_id,
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
