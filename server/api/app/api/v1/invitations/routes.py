from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import update
from sqlmodel import select

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.invitations.schemas import (
    CreatedInvitationResponse,
    CreateInvitationRequest,
    InvitationResponse,
    RedeemedInvitationResponse,
    RedeemInvitationRequest,
)
from app.auth import CurrentUser
from app.db.models import (
    Campus,
    ChurchMembership,
    ChurchRole,
    ChurchRoleAssignment,
    Invitation,
    InvitationRole,
    InvitationTeam,
    Ministry,
    Team,
    TeamMembership,
)
from app.permissions import require_action
from app.sync.openapi import sync_tags

router = APIRouter()
_MAX_EXPIRATION = timedelta(days=90)


def _token_hash(token: str) -> str:
    return sha256(token.encode()).hexdigest()


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


def _response(invitation: Invitation) -> InvitationResponse:
    return InvitationResponse(
        id=invitation.id,
        church_id=invitation.church_id,
        campus_id=invitation.campus_id,
        creator_user_id=invitation.creator_user_id,
        team_ids=[item.team_id for item in invitation.teams],
        role_ids=[item.church_role_id for item in invitation.roles],
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        revoked_at=invitation.revoked_at,
        redeemed_at=invitation.redeemed_at,
        claimed_by_user_id=invitation.claimed_by_user_id,
    )


def _load_scopes(
    db: DatabaseSession,
    *,
    church_id: UUID,
    campus_id: UUID | None,
    team_ids: list[UUID],
    role_ids: list[UUID],
) -> tuple[list[Team], list[ChurchRole]]:
    if (
        campus_id is not None
        and db.exec(
            select(Campus).where(Campus.id == campus_id, Campus.church_id == church_id)
        ).one_or_none()
        is None
    ):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    team_columns = Team.__table__.c  # pyright: ignore[reportAttributeAccessIssue]
    role_columns = ChurchRole.__table__.c  # pyright: ignore[reportAttributeAccessIssue]
    teams = (
        list(
            db.exec(
                select(Team)
                .join(Ministry)
                .where(
                    Ministry.church_id == church_id,
                    team_columns.id.in_(set(team_ids)),
                )
            ).all()
        )
        if team_ids
        else []
    )
    roles = (
        list(
            db.exec(
                select(ChurchRole).where(
                    ChurchRole.church_id == church_id,
                    role_columns.id.in_(set(role_ids)),
                )
            ).all()
        )
        if role_ids
        else []
    )
    if len(teams) != len(set(team_ids)) or len(roles) != len(set(role_ids)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    return teams, roles


def _can_delegate_role(
    db: DatabaseSession,
    membership: ChurchMembership,
    role: ChurchRole,
    campus_id: UUID | None,
) -> bool:
    assignments = db.exec(
        select(ChurchRoleAssignment).where(
            ChurchRoleAssignment.church_membership_id == membership.id
        )
    ).all()
    for assignment in assignments:
        assigned_role = db.get(ChurchRole, assignment.church_role_id)
        if assigned_role is None:
            continue
        applies = assignment.campus_id is None or assignment.campus_id == campus_id
        if applies and (assigned_role.is_administrator or assigned_role.id == role.id):
            return True
    return False


def _require_invitation_authority(
    db: DatabaseSession,
    membership: ChurchMembership,
    church_id: UUID,
    campus_id: UUID | None,
    roles: list[ChurchRole],
) -> None:
    require_action(
        membership,
        db,
        action="roles.manage",
        church_id=church_id,
        campus_id=campus_id,
    )
    if any(not _can_delegate_role(db, membership, role, campus_id) for role in roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)


@router.post(
    "/",
    operation_id="createInvitation",
    status_code=status.HTTP_201_CREATED,
)
def create_invitation(
    payload: CreateInvitationRequest, db: DatabaseSession, user: CurrentUser
) -> CreatedInvitationResponse:
    if payload.expires_in > _MAX_EXPIRATION:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    membership = get_church_membership_or_404(payload.church_id, user=user, db=db)
    teams, roles = _load_scopes(
        db,
        church_id=payload.church_id,
        campus_id=payload.campus_id,
        team_ids=payload.team_ids,
        role_ids=payload.role_ids,
    )
    _require_invitation_authority(
        db, membership, payload.church_id, payload.campus_id, roles
    )
    token = token_urlsafe(32)
    invitation = Invitation(
        church_id=payload.church_id,
        campus_id=payload.campus_id,
        creator_user_id=user.id,
        token_hash=_token_hash(token),
        expires_at=datetime.now(UTC) + payload.expires_in,
        teams=[InvitationTeam(team_id=team.id) for team in teams],
        roles=[InvitationRole(church_role_id=role.id) for role in roles],
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return CreatedInvitationResponse(**_response(invitation).model_dump(), token=token)


def _managed_invitation(
    invitation_id: UUID, db: DatabaseSession, user: CurrentUser
) -> Invitation:
    invitation = Invitation.get_or_404(db, invitation_id)
    membership = get_church_membership_or_404(invitation.church_id, user=user, db=db)
    require_action(
        membership,
        db,
        action="roles.manage",
        church_id=invitation.church_id,
        campus_id=invitation.campus_id,
    )
    return invitation


@router.get("/{invitation_id}", operation_id="getInvitation")
def get_invitation(
    invitation_id: UUID, db: DatabaseSession, user: CurrentUser
) -> InvitationResponse:
    return _response(_managed_invitation(invitation_id, db, user))


@router.delete(
    "/{invitation_id}",
    operation_id="revokeInvitation",
    status_code=status.HTTP_204_NO_CONTENT,
)
def revoke_invitation(
    invitation_id: UUID, db: DatabaseSession, user: CurrentUser
) -> Response:
    invitation = _managed_invitation(invitation_id, db, user)
    if invitation.redeemed_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT)
    if invitation.revoked_at is None:
        invitation.revoked_at = datetime.now(UTC)
        db.add(invitation)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/redeem",
    operation_id="redeemInvitation",
    openapi_extra=sync_tags("dashboard"),
)
def redeem_invitation(
    payload: RedeemInvitationRequest, db: DatabaseSession, user: CurrentUser
) -> RedeemedInvitationResponse:
    invitation = db.exec(
        select(Invitation).where(Invitation.token_hash == _token_hash(payload.token))
    ).one_or_none()
    now = datetime.now(UTC)
    if (
        invitation is None
        or invitation.revoked_at is not None
        or invitation.redeemed_at is not None
        or _aware(invitation.expires_at) <= now
    ):
        raise HTTPException(status_code=status.HTTP_410_GONE)
    teams, roles = _load_scopes(
        db,
        church_id=invitation.church_id,
        campus_id=invitation.campus_id,
        team_ids=[item.team_id for item in invitation.teams],
        role_ids=[item.church_role_id for item in invitation.roles],
    )
    creator_membership = db.exec(
        select(ChurchMembership).where(
            ChurchMembership.church_id == invitation.church_id,
            ChurchMembership.user_id == invitation.creator_user_id,
        )
    ).one_or_none()
    if creator_membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    _require_invitation_authority(
        db, creator_membership, invitation.church_id, invitation.campus_id, roles
    )
    invitation_columns = Invitation.__table__.c  # pyright: ignore[reportAttributeAccessIssue]
    claim = db.exec(
        update(
            Invitation.__table__  # pyright: ignore[reportAttributeAccessIssue]
        )
        .where(
            invitation_columns.id == invitation.id,
            invitation_columns.revoked_at.is_(None),
            invitation_columns.redeemed_at.is_(None),
            invitation_columns.expires_at > now,
        )
        .values(redeemed_at=now, claimed_by_user_id=user.id)
    )
    if claim.rowcount != 1:  # type: ignore[attr-defined]
        db.rollback()
        raise HTTPException(status_code=status.HTTP_410_GONE)
    membership = db.exec(
        select(ChurchMembership).where(
            ChurchMembership.church_id == invitation.church_id,
            ChurchMembership.user_id == user.id,
        )
    ).one_or_none()
    if membership is None:
        membership = ChurchMembership(church_id=invitation.church_id, user_id=user.id)
        db.add(membership)
        db.flush()
    for team in teams:
        existing_team = db.exec(
            select(TeamMembership).where(
                TeamMembership.church_membership_id == membership.id,
                TeamMembership.team_id == team.id,
            )
        ).one_or_none()
        if existing_team is None:
            db.add(TeamMembership(church_membership_id=membership.id, team_id=team.id))
    for role in roles:
        existing_role = db.exec(
            select(ChurchRoleAssignment).where(
                ChurchRoleAssignment.church_membership_id == membership.id,
                ChurchRoleAssignment.church_role_id == role.id,
                ChurchRoleAssignment.campus_id == invitation.campus_id,
                ChurchRoleAssignment.team_id == None,  # noqa: E711
            )
        ).one_or_none()
        if existing_role is None:
            db.add(
                ChurchRoleAssignment(
                    church_membership_id=membership.id,
                    church_role_id=role.id,
                    campus_id=invitation.campus_id,
                )
            )
    db.commit()
    return RedeemedInvitationResponse(
        invitation_id=invitation.id,
        church_id=invitation.church_id,
        membership_id=membership.id,
    )
