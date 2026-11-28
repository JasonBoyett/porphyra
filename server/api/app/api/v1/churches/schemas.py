from datetime import time
from uuid import UUID

from pydantic import Field, model_validator

from app.api.v1.campuses.schemas import CampusFieldsRequest, CampusLocationResponse
from app.db.models.campus import CampusType
from app.schemas.base import ApiModel


class CreateRecurringServiceRequest(ApiModel):
    name: str = Field(min_length=1, max_length=200)
    weekday: int = Field(ge=0, le=6, description="Monday is 0 and Sunday is 6.")
    starts_at: time
    duration_minutes: int | None = Field(default=None, ge=1, le=1440)


class CreateCampusRequest(CampusFieldsRequest):
    recurring_services: list[CreateRecurringServiceRequest] = Field(
        default_factory=list
    )


class CreateChurchRequest(ApiModel):
    idempotency_key: UUID
    name: str = Field(min_length=1, max_length=200)
    campuses: list[CreateCampusRequest] = Field(min_length=1)
    primary_campus_index: int | None = Field(default=0, ge=0)

    @model_validator(mode="after")
    def _validate_church(self) -> "CreateChurchRequest":
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("Church name must not be blank.")
        names = [campus.name.casefold() for campus in self.campuses]
        if len(names) != len(set(names)):
            raise ValueError("Campus names must be unique within a church.")
        if self.primary_campus_index is not None and self.primary_campus_index >= len(
            self.campuses
        ):
            raise ValueError("Primary campus index is outside the campuses list.")
        return self


class RecurringServiceResponse(ApiModel):
    id: UUID
    name: str
    weekday: int
    starts_at: time
    duration_minutes: int | None


class CampusResponse(ApiModel):
    id: UUID
    name: str
    campus_type: CampusType
    location: CampusLocationResponse
    recurring_services: list[RecurringServiceResponse]


class ChurchResponse(ApiModel):
    id: UUID
    name: str
    primary_campus_id: UUID | None
    campuses: list[CampusResponse]


class SetPrimaryCampusRequest(ApiModel):
    primary_campus_id: UUID | None


class UpdateCampusRequest(ApiModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    campus_type: CampusType | None = None
    address_line_1: str | None = Field(default=None, max_length=200)
    address_line_2: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=32)
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    time_zone: str | None = None
