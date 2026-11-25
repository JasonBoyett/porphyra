"""Synchronization declarations for campus-event planning resources."""

from app.api.v1.events.schemas import (
    MyVolunteerAssignmentResponse,
    VolunteerRequestRosterResponse,
)
from app.sync.contracts import Syncable, SyncAction, SyncCollection, SyncOperation

accept_volunteer_request_action = SyncAction(
    "accept",
    parameter_bindings={"event_team_id": "campusEventTeamId", "request_id": "id"},
)
decline_volunteer_request_action = SyncAction(
    "decline",
    parameter_bindings={"event_team_id": "campusEventTeamId", "request_id": "id"},
)
cancel_volunteer_assignment_action = SyncAction(
    "cancel",
    parameter_bindings={"event_team_id": "campusEventTeamId", "volunteer_id": "id"},
)
volunteer_request_refresh = SyncOperation()

volunteer_request = Syncable(
    VolunteerRequestRosterResponse,
    tag="volunteer-requests",
    identity=("id", "campusEventTeamId"),
    actions=(accept_volunteer_request_action, decline_volunteer_request_action),
)
team_volunteer_requests = SyncCollection(
    member=volunteer_request,
    tag="campus-event-team-volunteer-requests",
    identity="eventTeamId",
    refresh=volunteer_request_refresh,
)
my_volunteer_assignments_refresh = SyncOperation()

volunteer_assignment = Syncable(
    MyVolunteerAssignmentResponse,
    tag="volunteer-assignments",
    identity=("id", "campusEventTeamId"),
	actions=(cancel_volunteer_assignment_action,),
)
my_volunteer_assignments = SyncCollection(
    member=volunteer_assignment,
    tag="my-volunteer-assignments",
    identity="userId",
    refresh=my_volunteer_assignments_refresh,
)

campus_sync_resources = (
    volunteer_request,
    team_volunteer_requests,
    volunteer_assignment,
    my_volunteer_assignments,
)
