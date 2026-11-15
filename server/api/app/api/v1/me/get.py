from fastapi import APIRouter

from app.auth import CurrentUser
from app.db.models import User

router = APIRouter()


@router.get("/", operation_id="getCurrentUser")
def get_current_user(user: CurrentUser) -> User:
	return user
