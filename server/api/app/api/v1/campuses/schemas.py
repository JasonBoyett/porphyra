from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, field_validator

from app.db.models.campus import CampusType
from app.schemas.base import ApiModel


class CampusLocationResponse(ApiModel):
    """A campus's physical address and authoritative local scheduling timezone."""

    address_line_1: str | None
    address_line_2: str | None
    city: str | None
    region: str | None
    postal_code: str | None
    country_code: str | None = Field(min_length=2, max_length=2)
    time_zone: str


class CampusAddressRequest(ApiModel):
    address_line_1: str | None = Field(default=None, max_length=200)
    address_line_2: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=32)
    country_code: str | None = Field(default=None, min_length=2, max_length=2)


class CampusFieldsRequest(ApiModel):
    name: str = Field(min_length=1, max_length=200)
    campus_type: CampusType = CampusType.PHYSICAL
    address: CampusAddressRequest | None = None
    time_zone: str = "America/Chicago"

    @field_validator("name")
    @classmethod
    def _name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Campus name must not be blank.")
        return value

    @field_validator("time_zone")
    @classmethod
    def _time_zone_must_be_iana(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as error:
            raise ValueError(
                "Time zone must be a canonical IANA identifier."
            ) from error
        if value == "localtime" or value.startswith(("Etc/GMT+", "Etc/GMT-")):
            raise ValueError("Time zone must be a canonical IANA identifier.")
        return value
