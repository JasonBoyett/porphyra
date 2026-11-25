from app.api.v1.campuses.schemas import CampusLocationResponse
from app.db.models import Campus


def campus_location_response(campus: Campus) -> CampusLocationResponse:
	return CampusLocationResponse(
		address_line_1=campus.address_line_1,
		address_line_2=campus.address_line_2,
		city=campus.city,
		region=campus.region,
		postal_code=campus.postal_code,
		country_code=campus.country_code,
		time_zone=campus.time_zone,
	)
