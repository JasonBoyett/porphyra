from uuid import UUID

from app.api.v1.campuses.schemas import CampusLocationResponse
from app.schemas.base import ApiModel


class DashboardViewerResponse(ApiModel):
	id: UUID
	avatar_url: str
	email: str
	name: str


class DashboardTeamResponse(ApiModel):
	id: UUID
	name: str


class DashboardMinistryResponse(ApiModel):
	id: UUID
	name: str
	teams: list[DashboardTeamResponse]


class DashboardCampusResponse(ApiModel):
	id: UUID
	name: str
	location: CampusLocationResponse


class DashboardChurchResponse(ApiModel):
	id: UUID
	avatar_url: str
	name: str
	description: str
	campuses: list[DashboardCampusResponse]
	ministries: list[DashboardMinistryResponse]


class DashboardResponse(ApiModel):
	viewer: DashboardViewerResponse
	churches: list[DashboardChurchResponse]
