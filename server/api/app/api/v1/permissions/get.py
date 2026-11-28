from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.api.v1.dependencies.database import DatabaseSession
from app.auth import CurrentUser
from app.db.models import (
    ChurchMembership,
    ChurchRole,
    ChurchRoleAssignment,
    ChurchRolePermission,
)
from app.permissions import ALL_PERMISSIONS
from app.schemas.base import ApiModel

router = APIRouter()


class TeamPermissionSnapshot(ApiModel):
    permissions: list[str]


class CampusPermissionSnapshot(ApiModel):
    permissions: list[str]
    teams: dict[UUID, TeamPermissionSnapshot]


class ChurchPermissionSnapshot(ApiModel):
    church_id: UUID
    permissions: list[str]
    campuses: dict[UUID, CampusPermissionSnapshot]


@router.get("/{church_id}", operation_id="getChurchPermissions")
def get_church_permissions(
    church_id: UUID,
    db: DatabaseSession,
    user: CurrentUser,
) -> ChurchPermissionSnapshot:
    membership = db.exec(
        select(ChurchMembership).where(
            ChurchMembership.church_id == church_id,
            ChurchMembership.user_id == user.id,
        )
    ).one_or_none()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    assignments_table = ChurchRoleAssignment.__table__  # pyright: ignore[reportAttributeAccessIssue]
    roles_table = ChurchRole.__table__  # pyright: ignore[reportAttributeAccessIssue]
    assignments = db.exec(
        select(ChurchRoleAssignment, ChurchRole)
        .join(ChurchRole, roles_table.c.id == assignments_table.c.church_role_id)
        .where(
            ChurchRoleAssignment.church_membership_id == membership.id,
            ChurchRole.church_id == church_id,
        )
    ).all()
    role_permissions = {
        role.id: set(ALL_PERMISSIONS)
        if role.is_administrator
        else set(
            db.exec(
                select(ChurchRolePermission.permission).where(
                    ChurchRolePermission.church_role_id == role.id
                )
            ).all()
        )
        for _, role in assignments
    }
    church_permissions: set[str] = set()
    campuses: dict[UUID, CampusPermissionSnapshot] = {}
    for assignment, role in assignments:
        permissions = role_permissions[role.id]
        if assignment.campus_id is None:
            church_permissions.update(permissions)
            continue
        campus = campuses.setdefault(
            assignment.campus_id,
            CampusPermissionSnapshot(permissions=[], teams={}),
        )
        if assignment.team_id is None:
            campus.permissions = sorted(set(campus.permissions) | permissions)
            continue
        team = campus.teams.setdefault(
            assignment.team_id, TeamPermissionSnapshot(permissions=[])
        )
        team.permissions = sorted(set(team.permissions) | permissions)
    return ChurchPermissionSnapshot(
        church_id=church_id,
        permissions=sorted(church_permissions),
        campuses=campuses,
    )
