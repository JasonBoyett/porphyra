import { apiOperations, apiSyncTags, type ApiSyncTag } from "@porphyra/frontend/api/operations"

export type ApiTag = ApiSyncTag

export const apiTag = {
	dashboard: apiOperations.getDashboard.syncTags[0],
	campusEvents: apiOperations.getCampusEvents.syncTags[0],
	campusEventPlanning: apiOperations.getCampusEventPlanning.syncTags[1],
} as const

export const isApiTag = (value: unknown): value is ApiTag =>
	typeof value === "string" && apiSyncTags.includes(value as ApiTag)

export const apiTags = {
	dashboard: apiOperations.getDashboard.syncTags,
	campusEvents: apiOperations.getCampusEvents.syncTags,
	campusEventPlanning: apiOperations.getCampusEventPlanning.syncTags,
} as const
