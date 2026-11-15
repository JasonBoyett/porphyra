from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import select

from app.api.v1.dependencies.database import DatabaseSession
from app.auth import CurrentUser
from app.db.models import ChurchMembership


def get_church_membership_or_404(
	church_id: UUID,
	user: CurrentUser,
	db: DatabaseSession,
) -> ChurchMembership:
	membership = db.exec(
		select(ChurchMembership).where(
			ChurchMembership.church_id == church_id,
			ChurchMembership.user_id == user.id,
		)
	).one_or_none()
	if membership is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	return membership
