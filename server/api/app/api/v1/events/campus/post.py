from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events._responses import campus_event_response
from app.api.v1.events.schemas import CampusEventResponse, CreateCampusEventRequest
from app.auth import CurrentUser
from app.db.models import Campus, CampusEvent
from app.sync.audience import church_member_user_ids
from app.sync.publish import publish
from app.sync.tags import SyncTag

router = APIRouter()


@router.post("/", operation_id="createCampusEvent", status_code=status.HTTP_201_CREATED)
def create_campus_event(
    payload: CreateCampusEventRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> CampusEventResponse:
    get_church_membership_or_404(payload.church_id, user=user, db=db)
    campus = db.exec(
        select(Campus).where(
            Campus.church_id == payload.church_id,
            Campus.id == payload.campus_id,
        )
    ).one_or_none()
    if campus is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    event = CampusEvent(**payload.model_dump(by_alias=False))
    db.add(event)
    db.flush()
    db.refresh(event)
    response = publish(
        campus_event_response(event),
        recipients=church_member_user_ids(db, event.church_id),
        tags=(SyncTag.CAMPUS_EVENTS, SyncTag.CAMPUS_EVENT_PLANNING),
        session=db,
    )
    db.commit()
    return response
