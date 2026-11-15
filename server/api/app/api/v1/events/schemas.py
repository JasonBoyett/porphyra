from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.db.schemas import RoleTemplateData, TeamRoleData
from app.schemas.base import ApiModel
from app.sync.model import SyncableApiModel


class CreateCampusEventRequest(ApiModel):
	church_id: UUID
	campus_id: UUID
	title: str
	description: str = ""
	starts_at: datetime
	ends_at: datetime | None = None


class CreateChurchEventRequest(ApiModel):
	church_id: UUID
	title: str
	description: str = ""
	starts_at: datetime
	ends_at: datetime | None = None


class ScheduleMinistryRequest(ApiModel):
	ministry_id: UUID


class ScheduleTeamRequest(ApiModel):
	team_id: UUID
	call_time: datetime | None = None
	notes: list[str] = Field(default_factory=list)


class UpdateTeamRoleRequirementsRequest(ApiModel):
	roles: RoleTemplateData


class AssignVolunteerRequest(ApiModel):
	team_membership_id: UUID
	confirm_conflict: bool = False


class UpdateVolunteerRoleRequest(ApiModel):
	role_name: str | None = Field(default=None, max_length=100)
	role_emoji: str | None = Field(default=None, max_length=16)


class ConfirmScheduleRequest(ApiModel):
	team_membership_id: UUID


class EventResponse(ApiModel):
	id: UUID
	church_id: UUID
	title: str
	description: str
	starts_at: datetime
	ends_at: datetime | None
	is_staffed: bool
	is_fully_staffed: bool
	teams_needing_confirmation: list[UUID]


class CampusEventResponse(EventResponse, SyncableApiModel):
	campus_id: UUID


class ScheduledMinistryResponse(SyncableApiModel):
	id: UUID
	ministry_id: UUID


class ScheduledTeamResponse(SyncableApiModel):
	id: UUID
	team_id: UUID
	call_time: datetime | None
	notes: list[str]
	confirmed_at: datetime | None
	is_fully_staffed: bool
	roles: TeamRoleData


class VolunteerAssignmentResponse(SyncableApiModel):
	id: UUID
	team_membership_id: UUID
	role_name: str | None
	role_emoji: str | None
	conflict_confirmed_at: datetime | None


class ScheduledVolunteerResponse(ApiModel):
	assignment_id: UUID
	team_membership_id: UUID
	user_id: UUID
	name: str
	email: str
	avatar_url: str
	role_name: str | None
	role_emoji: str | None
	conflict_confirmed_at: datetime | None


class CampusEventTeamScheduleResponse(ApiModel):
	id: UUID
	team_id: UUID
	name: str
	call_time: datetime | None
	notes: list[str]
	confirmed_at: datetime | None
	is_fully_staffed: bool
	roles: TeamRoleData
	volunteers: list[ScheduledVolunteerResponse]
	eligible_volunteers: list[ScheduledVolunteerResponse]


class CampusEventMinistryScheduleResponse(ApiModel):
	id: UUID
	name: str
	teams: list[CampusEventTeamScheduleResponse]


class CampusEventPlanningResponse(CampusEventResponse):
	church_name: str
	campus_name: str
	ministries: list[CampusEventMinistryScheduleResponse]


class CampusEventListItem(ApiModel):
	id: UUID
	church_id: UUID
	church_name: str
	campus_id: UUID
	campus_name: str
	title: str
	starts_at: datetime
	ends_at: datetime | None
	is_staffed: bool
	is_fully_staffed: bool
