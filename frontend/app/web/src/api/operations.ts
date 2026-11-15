import { apiTags } from "./tags"

/** Typed GET contract metadata; request functions remain hand-authored for now. */
export const apiQueryOperations = {
	dashboard: {
		key: "GET /api/v1/dashboard",
		syncTags: apiTags.dashboard,
	},
	campusEvents: {
		key: "GET /api/v1/events/campus",
		syncTags: apiTags.campusEvents,
	},
	campusEventPlanning: {
		key: "GET /api/v1/events/campus/{eventId}",
		syncTags: apiTags.campusEventPlanning,
	},
} as const
