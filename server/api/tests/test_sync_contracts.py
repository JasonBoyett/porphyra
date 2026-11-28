from app.main import create_app


def test_openapi_exports_bound_sync_resource_contract() -> None:
    schema = create_app().openapi()

    assert schema["x-sync-resources"] == [
        {
            "kind": "resource",
            "tag": "volunteer-requests",
            "identity": ["id", "campusEventTeamId"],
            "refreshOperationId": None,
            "mutateOperationId": None,
            "actions": [
                {
                    "name": "accept",
                    "operationId": "acceptVolunteerRequest",
                    "parameterBindings": {
                        "event_team_id": "campusEventTeamId",
                        "request_id": "id",
                    },
                },
                {
                    "name": "decline",
                    "operationId": "declineVolunteerRequest",
                    "parameterBindings": {
                        "event_team_id": "campusEventTeamId",
                        "request_id": "id",
                    },
                },
            ],
        },
        {
            "kind": "collection",
            "tag": "campus-event-team-volunteer-requests",
            "identity": ["eventTeamId"],
            "memberTag": "volunteer-requests",
            "refreshOperationId": "getCampusEventTeamVolunteerRequests",
        },
        {
            "kind": "resource",
            "tag": "volunteer-assignments",
            "identity": ["id", "campusEventTeamId"],
            "refreshOperationId": None,
            "mutateOperationId": None,
            "actions": [
                {
                    "name": "cancel",
                    "operationId": "cancelMyVolunteerAssignment",
                    "parameterBindings": {
                        "event_team_id": "campusEventTeamId",
                        "volunteer_id": "id",
                    },
                }
            ],
        },
        {
            "kind": "collection",
            "tag": "my-volunteer-assignments",
            "identity": ["userId"],
            "memberTag": "volunteer-assignments",
            "refreshOperationId": "getMyVolunteerAssignments",
        },
        {
            "kind": "resource",
            "tag": "campus-event-teams",
            "identity": ["id"],
            "refreshOperationId": None,
            "mutateOperationId": None,
            "actions": [
                {
                    "name": "updateRoleRequirements",
                    "operationId": "updateCampusEventTeamRoleRequirements",
                    "parameterBindings": {"event_team_id": "id"},
                },
                {
                    "name": "assignVolunteer",
                    "operationId": "assignCampusEventVolunteer",
                    "parameterBindings": {"event_team_id": "id"},
                },
                {
                    "name": "createVolunteerReplacement",
                    "operationId": "createVolunteerReplacement",
                    "parameterBindings": {"event_team_id": "id"},
                },
                {
                    "name": "changeVolunteerRole",
                    "operationId": "changeCampusEventVolunteerRole",
                    "parameterBindings": {"event_team_id": "id"},
                },
                {
                    "name": "dropVolunteer",
                    "operationId": "dropCampusEventVolunteer",
                    "parameterBindings": {"event_team_id": "id"},
                },
            ],
        },
    ]


def test_openapi_marks_nested_planning_team_resources() -> None:
    schema = create_app().openapi()
    operation = schema["paths"]["/api/v1/events/campus/{event_id}"]["get"]

    assert operation["x-sync-resource-views"] == [
        {
            "tag": "campus-event-teams",
            "path": "$.ministries[].teams[]",
            "identity": ["id"],
        }
    ]


def test_openapi_marks_roster_identity_locations() -> None:
    schema = create_app().openapi()
    operation = schema["paths"][
        "/api/v1/events/campus/teams/{event_team_id}/volunteer-requests"
    ]["get"]

    assert operation["x-sync-resource-views"] == [
        {
            "tag": "volunteer-requests",
            "path": "$[]",
            "identity": ["id", "campusEventTeamId"],
        }
    ]


def test_openapi_marks_my_volunteer_assignment_collection_and_members() -> None:
    schema = create_app().openapi()
    operation = schema["paths"]["/api/v1/events/campus/volunteer-assignments"]["get"]

    assert operation["x-sync-resource-views"] == [
        {
            "tag": "my-volunteer-assignments",
            "path": "$",
            "identity": ["userId"],
        },
        {
            "tag": "volunteer-assignments",
            "path": "$.assignments[]",
            "identity": ["id", "campusEventTeamId"],
        },
    ]
