export const apiTag = {
	dashboard: "dashboard",
	campusEvents: "campus-events",
	campusEventPlanning: "campus-event-planning",
} as const

export type ApiTag = (typeof apiTag)[keyof typeof apiTag]

const apiTagValues = new Set<string>(Object.values(apiTag))

export const isApiTag = (value: unknown): value is ApiTag =>
	typeof value === "string" && apiTagValues.has(value)

export const apiTags = {
	dashboard: [apiTag.dashboard] as const,
	campusEvents: [apiTag.campusEvents] as const,
	campusEventPlanning: [apiTag.campusEvents, apiTag.campusEventPlanning] as const,
} as const
