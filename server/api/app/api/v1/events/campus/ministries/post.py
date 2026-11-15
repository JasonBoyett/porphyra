from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.api.v1.events.schemas import ScheduledMinistryResponse, ScheduleMinistryRequest
from app.auth import CurrentUser
from app.db.models import CampusEvent, CampusEventMinistry, Ministry
from app.sync.audience import church_member_user_ids
from app.sync.publish import publish
from app.sync.tags import SyncTag

router = APIRouter()


@router.post(
    "/{event_id}/ministries",
    operation_id="scheduleCampusEventMinistry",
    status_code=status.HTTP_201_CREATED,
)
def schedule_ministry(
    event_id: UUID,
    payload: ScheduleMinistryRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> ScheduledMinistryResponse:
    event = db.get(CampusEvent, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    get_church_membership_or_404(event.church_id, user=user, db=db)
    ministry = db.get(Ministry, payload.ministry_id)
    if ministry is None or ministry.church_id != event.church_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    existing = next(
        (
            event_ministry
            for event_ministry in event.ministries
            if event_ministry.ministry_id == ministry.id
        ),
        None,
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT)
    event_ministry = CampusEventMinistry(
        campus_event_id=event.id,
        ministry_id=ministry.id,
    )
    db.add(event_ministry)
    db.flush()
    db.refresh(event_ministry)
    response = publish(
        ScheduledMinistryResponse(
            id=event_ministry.id,
            ministry_id=ministry.id,
            sync_recipient_ids=church_member_user_ids(db, event.church_id),
        ),
        tags=(SyncTag.CAMPUS_EVENTS, SyncTag.CAMPUS_EVENT_PLANNING),
        session=db,
    )
    db.commit()
    return response
