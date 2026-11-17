/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Do not make direct changes to this file.
 */

export const apiOperations = {
	getAllChurchMemberships: {
		method: "get",
		pathParams: [],
		queryParams: [],
		route: "/api/v1/church-memberships/",
		syncTags: [],
	},
	getChurchMembership: {
		method: "get",
		pathParams: ["church_id"],
		queryParams: [],
		route: "/api/v1/church-memberships/{church_id}",
		syncTags: [],
	},
	getDashboard: {
		method: "get",
		pathParams: [],
		queryParams: [],
		route: "/api/v1/dashboard/",
		syncTags: ["dashboard"],
	},
	getCampusEvents: {
		method: "get",
		pathParams: [],
		queryParams: [],
		route: "/api/v1/events/campus/",
		syncTags: ["campus-events"],
	},
	createCampusEvent: {
		method: "post",
		pathParams: [],
		queryParams: [],
		route: "/api/v1/events/campus/",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	getCampusEventTeamVolunteerRequests: {
		method: "get",
		pathParams: ["event_team_id"],
		queryParams: ["include_resolved"],
		route: "/api/v1/events/campus/teams/{event_team_id}/volunteer-requests",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	getMyVolunteerRequests: {
		method: "get",
		pathParams: [],
		queryParams: ["include_resolved"],
		route: "/api/v1/events/campus/volunteer-requests",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	getCampusEventPlanning: {
		method: "get",
		pathParams: ["event_id"],
		queryParams: [],
		route: "/api/v1/events/campus/{event_id}",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	createChurchEvent: {
		method: "post",
		pathParams: [],
		queryParams: [],
		route: "/api/v1/events/church/",
		syncTags: [],
	},
	scheduleCampusEventMinistry: {
		method: "post",
		pathParams: ["event_id"],
		queryParams: [],
		route: "/api/v1/events/campus/{event_id}/ministries",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	scheduleCampusEventTeam: {
		method: "post",
		pathParams: ["event_ministry_id"],
		queryParams: [],
		route: "/api/v1/events/campus/ministries/{event_ministry_id}/teams",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	updateCampusEventTeamRoleRequirements: {
		method: "patch",
		pathParams: ["event_team_id"],
		queryParams: [],
		route: "/api/v1/events/campus/{event_team_id}/roles",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	assignCampusEventVolunteer: {
		method: "post",
		pathParams: ["event_team_id"],
		queryParams: [],
		route: "/api/v1/events/campus/{event_team_id}/volunteers",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	createVolunteerReplacement: {
		method: "post",
		pathParams: ["event_team_id", "request_id"],
		queryParams: [],
		route:
			"/api/v1/events/campus/{event_team_id}/volunteer-requests/{request_id}/replacement",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	acceptVolunteerRequest: {
		method: "post",
		pathParams: ["event_team_id", "request_id"],
		queryParams: [],
		route:
			"/api/v1/events/campus/{event_team_id}/volunteer-requests/{request_id}/accept",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	declineVolunteerRequest: {
		method: "post",
		pathParams: ["event_team_id", "request_id"],
		queryParams: [],
		route:
			"/api/v1/events/campus/{event_team_id}/volunteer-requests/{request_id}/decline",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	changeCampusEventVolunteerRole: {
		method: "post",
		pathParams: ["event_team_id", "volunteer_id"],
		queryParams: [],
		route:
			"/api/v1/events/campus/{event_team_id}/volunteers/role/{volunteer_id}",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	dropCampusEventVolunteer: {
		method: "post",
		pathParams: ["event_team_id", "volunteer_id"],
		queryParams: [],
		route:
			"/api/v1/events/campus/{event_team_id}/volunteers/drop/{volunteer_id}",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	confirmCampusEventTeam: {
		method: "post",
		pathParams: ["event_team_id"],
		queryParams: [],
		route: "/api/v1/events/campus/{event_team_id}/confirmation",
		syncTags: ["campus-events", "campus-event-planning"],
	},
	getCurrentUser: {
		method: "get",
		pathParams: [],
		queryParams: [],
		route: "/api/v1/me/",
		syncTags: [],
	},
	health_health_get: {
		method: "get",
		pathParams: [],
		queryParams: [],
		route: "/health",
		syncTags: [],
	},
} as const;

export const apiSyncTags = [
	"dashboard",
	"campus-events",
	"campus-event-planning",
] as const;
export type ApiSyncTag =
	(typeof apiOperations)[keyof typeof apiOperations]["syncTags"][number];
