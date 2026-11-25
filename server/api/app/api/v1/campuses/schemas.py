from pydantic import Field

from app.schemas.base import ApiModel


class CampusLocationResponse(ApiModel):
	"""A campus's physical address and authoritative local scheduling timezone."""

	address_line_1: str
	address_line_2: str | None
	city: str
	region: str
	postal_code: str
	country_code: str = Field(min_length=2, max_length=2)
	time_zone: str
