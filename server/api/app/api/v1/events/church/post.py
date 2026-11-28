from fastapi import APIRouter, status

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events._responses import church_event_response
from app.api.v1.events.schemas import CreateChurchEventRequest, EventResponse
from app.auth import CurrentUser
from app.db.models import ChurchEvent
from app.permissions import require_action

router = APIRouter()


@router.post("/", operation_id="createChurchEvent", status_code=status.HTTP_201_CREATED)
def create_church_event(
    payload: CreateChurchEventRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> EventResponse:
    membership = get_church_membership_or_404(payload.church_id, user=user, db=db)
    require_action(membership, db, action="events.manage", church_id=payload.church_id)
    event = ChurchEvent(**payload.model_dump(by_alias=False))
    db.add(event)
    db.commit()
    db.refresh(event)
    return church_event_response(event)
