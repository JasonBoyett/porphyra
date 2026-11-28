"""Synchronization declarations for campus-event planning resources."""

from app.api.v1.events.schemas import (
    CampusEventTeamScheduleResponse,
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
update_team_role_requirements_action = SyncAction(
    "updateRoleRequirements",
    parameter_bindings={"event_team_id": "id"},
)
assign_team_volunteer_action = SyncAction(
    "assignVolunteer",
    parameter_bindings={"event_team_id": "id"},
)
create_team_volunteer_replacement_action = SyncAction(
    "createVolunteerReplacement",
    parameter_bindings={"event_team_id": "id"},
)
change_team_volunteer_role_action = SyncAction(
    "changeVolunteerRole",
    parameter_bindings={"event_team_id": "id"},
)
drop_team_volunteer_action = SyncAction(
    "dropVolunteer",
    parameter_bindings={"event_team_id": "id"},
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
campus_event_team = Syncable(
    CampusEventTeamScheduleResponse,
    tag="campus-event-teams",
    identity="id",
    actions=(
        update_team_role_requirements_action,
        assign_team_volunteer_action,
        create_team_volunteer_replacement_action,
        change_team_volunteer_role_action,
        drop_team_volunteer_action,
    ),
)

campus_sync_resources = (
    volunteer_request,
    team_volunteer_requests,
    volunteer_assignment,
    my_volunteer_assignments,
    campus_event_team,
)
