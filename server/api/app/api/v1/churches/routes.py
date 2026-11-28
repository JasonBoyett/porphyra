from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.api.v1.campuses._responses import campus_location_response
from app.api.v1.churches.schemas import (
    CampusResponse,
    ChurchResponse,
    CreateChurchRequest,
    RecurringServiceResponse,
    SetPrimaryCampusRequest,
    UpdateCampusRequest,
)
from app.api.v1.dependencies.church_membership import get_church_membership_or_404
from app.api.v1.dependencies.database import DatabaseSession
from app.auth import CurrentUser
from app.db.models import (
    Campus,
    Church,
    ChurchMembership,
    ChurchRole,
    ChurchRoleAssignment,
    RecurringService,
)
from app.permissions import require_action
from app.sync.openapi import sync_tags

router = APIRouter()


def _church_response(church: Church) -> ChurchResponse:
    return ChurchResponse(
        id=church.id,
        name=church.name,
        primary_campus_id=church.primary_campus_id,
        campuses=[
            CampusResponse(
                id=campus.id,
                name=campus.name,
                campus_type=campus.campus_type,
                location=campus_location_response(campus),
                recurring_services=[
                    RecurringServiceResponse.from_db_model(service)
                    for service in campus.recurring_services
                ],
            )
            for campus in church.campuses
        ],
    )


@router.post(
    "/",
    operation_id="createChurch",
    status_code=status.HTTP_201_CREATED,
    openapi_extra=sync_tags("dashboard"),
)
def create_church(
    payload: CreateChurchRequest, db: DatabaseSession, user: CurrentUser
) -> ChurchResponse:
    existing = db.exec(
        select(Church)
        .join(ChurchMembership)
        .where(
            Church.onboarding_key == payload.idempotency_key,
            ChurchMembership.user_id == user.id,
        )
    ).one_or_none()
    if existing is not None:
        return _church_response(existing)
    if (
        db.exec(select(Church).where(Church.name == payload.name)).one_or_none()
        is not None
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT)

    church = Church(name=payload.name, onboarding_key=payload.idempotency_key)
    db.add(church)
    db.flush()
    campuses: list[Campus] = []
    for campus_data in payload.campuses:
        address = campus_data.address
        campus = Campus(
            church_id=church.id,
            name=campus_data.name,
            campus_type=campus_data.campus_type,
            time_zone=campus_data.time_zone,
            **(address.model_dump(by_alias=False) if address is not None else {}),
        )
        db.add(campus)
        db.flush()
        campuses.append(campus)
        for service_data in campus_data.recurring_services:
            db.add(
                RecurringService(
                    campus_id=campus.id, **service_data.model_dump(by_alias=False)
                )
            )

    if payload.primary_campus_index is not None:
        church.primary_campus_id = campuses[payload.primary_campus_index].id
    membership = ChurchMembership(user_id=user.id, church_id=church.id)
    administrator = ChurchRole(
        church_id=church.id, name="Administrator", is_administrator=True
    )
    db.add(membership)
    db.add(administrator)
    db.flush()
    db.add(
        ChurchRoleAssignment(
            church_membership_id=membership.id,
            church_role_id=administrator.id,
        )
    )
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT) from error
    db.refresh(church)
    return _church_response(church)


@router.patch(
    "/{church_id}/primary-campus",
    operation_id="setPrimaryCampus",
    openapi_extra=sync_tags("dashboard"),
)
def set_primary_campus(
    church_id: UUID,
    payload: SetPrimaryCampusRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> ChurchResponse:
    membership = get_church_membership_or_404(church_id, user=user, db=db)
    require_action(membership, db, action="roles.manage", church_id=church_id)
    church = Church.get_or_404(db, church_id)
    if payload.primary_campus_id is not None:
        campus = db.exec(
            select(Campus).where(
                Campus.id == payload.primary_campus_id,
                Campus.church_id == church_id,
            )
        ).one_or_none()
        if campus is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT)
    church.primary_campus_id = payload.primary_campus_id
    db.add(church)
    db.commit()
    db.refresh(church)
    return _church_response(church)


@router.patch(
    "/{church_id}/campuses/{campus_id}",
    operation_id="updateCampus",
    openapi_extra=sync_tags("dashboard"),
)
def update_campus(
    church_id: UUID,
    campus_id: UUID,
    payload: UpdateCampusRequest,
    db: DatabaseSession,
    user: CurrentUser,
) -> CampusResponse:
    membership = get_church_membership_or_404(church_id, user=user, db=db)
    require_action(
        membership, db, action="roles.manage", church_id=church_id, campus_id=campus_id
    )
    campus = db.exec(
        select(Campus).where(Campus.id == campus_id, Campus.church_id == church_id)
    ).one_or_none()
    if campus is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    values = payload.model_dump(exclude_unset=True, by_alias=False)
    if "time_zone" in values and values["time_zone"] is not None:
        try:
            ZoneInfo(values["time_zone"])
        except ZoneInfoNotFoundError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT
            ) from error
    for name, value in values.items():
        setattr(campus, name, value.strip() if name == "name" and value else value)
    db.add(campus)
    db.commit()
    db.refresh(campus)
    return CampusResponse(
        id=campus.id,
        name=campus.name,
        campus_type=campus.campus_type,
        location=campus_location_response(campus),
        recurring_services=[
            RecurringServiceResponse.from_db_model(service)
            for service in campus.recurring_services
        ],
    )


@router.delete(
    "/{church_id}/campuses/{campus_id}",
    operation_id="deleteCampus",
    status_code=status.HTTP_204_NO_CONTENT,
    openapi_extra=sync_tags("dashboard"),
)
def delete_campus(
    church_id: UUID, campus_id: UUID, db: DatabaseSession, user: CurrentUser
) -> Response:
    membership = get_church_membership_or_404(church_id, user=user, db=db)
    require_action(
        membership, db, action="roles.manage", church_id=church_id, campus_id=campus_id
    )
    church = Church.get_or_404(db, church_id)
    campus = db.exec(
        select(Campus).where(Campus.id == campus_id, Campus.church_id == church_id)
    ).one_or_none()
    if campus is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if church.primary_campus_id == campus.id:
        church.primary_campus_id = None
        db.add(church)
        db.flush()
    db.delete(campus)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
