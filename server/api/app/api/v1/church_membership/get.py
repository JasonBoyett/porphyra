from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies.database import DatabaseSession
from app.auth import CurrentUser
from app.db.models import ChurchMembership

router = APIRouter()


@router.get("/", operation_id="getAllChurchMemberships")
def get_memberships(
	db: DatabaseSession, user: CurrentUser
) -> list[ChurchMembership]:
	memberships = ChurchMembership.get_all_for_user(db, user.id)
	return memberships


@router.get("/{church_id}", operation_id="getChurchMembership")
def get_church_membership(
	church_id: str, db: DatabaseSession, user: CurrentUser
) -> ChurchMembership:
	membership = ChurchMembership.get_for_user_in_church(db, user.id, church_id)
	if membership is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
	return membership
