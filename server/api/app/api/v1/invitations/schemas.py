from datetime import datetime, timedelta
from uuid import UUID

from pydantic import Field

from app.schemas.base import ApiModel


class CreateInvitationRequest(ApiModel):
    church_id: UUID
    campus_id: UUID | None = None
    team_ids: list[UUID] = Field(default_factory=list)
    role_ids: list[UUID] = Field(default_factory=list)
    expires_in: timedelta = Field(default=timedelta(days=7), gt=timedelta(0))


class RedeemInvitationRequest(ApiModel):
    token: str = Field(min_length=32, max_length=512)


class InvitationResponse(ApiModel):
    id: UUID
    church_id: UUID
    campus_id: UUID | None
    creator_user_id: UUID
    team_ids: list[UUID]
    role_ids: list[UUID]
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None
    redeemed_at: datetime | None
    claimed_by_user_id: UUID | None


class CreatedInvitationResponse(InvitationResponse):
    token: str


class RedeemedInvitationResponse(ApiModel):
    invitation_id: UUID
    church_id: UUID
    membership_id: UUID
