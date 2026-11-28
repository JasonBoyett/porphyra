import axios from "axios"
import type { AxiosRequestConfig } from "axios"
import { apiOperations } from "@porphyra/frontend/api/operations"
import type {
	CampusEventPlanningResponse,
	CampusEventTeamScheduleResponse,
	DashboardResponse,
	MyVolunteerAssignmentResponse,
	ScheduledVolunteerResponse,
	TeamRoleResponse,
	VolunteerAssignmentResponse,
	VolunteerRequestRosterResponse,
	ApiSyncResourceActionMethods,
} from "@porphyra/frontend/api/types"

import { getStoredSession } from "@/auth"
import { decorateApiClient } from "./decorate-api-client"
import type { ApiClientOperationId, ApiClientTransport } from "./client-types"

export type Dashboard = DashboardResponse
export type PlannedVolunteer = ScheduledVolunteerResponse
export type TeamRole = TeamRoleResponse
export type VolunteerRequestStatus = VolunteerRequestRosterResponse["status"]
export type VolunteerRequest = VolunteerRequestRosterResponse
export type VolunteerRequestWithActions = VolunteerRequest &
	ApiSyncResourceActionMethods<"volunteer-requests">
export type VolunteerAssignment = VolunteerAssignmentResponse
export type VolunteerAssignmentWithActions = MyVolunteerAssignmentResponse &
	ApiSyncResourceActionMethods<"volunteer-assignments">
export type CampusEventPlanning = CampusEventPlanningResponse
export type CampusEventPlanningTeam = CampusEventTeamScheduleResponse &
	ApiSyncResourceActionMethods<"campus-event-teams">
type CampusEventPlanningMinistry = CampusEventPlanningResponse["ministries"][number]
export type CampusEventPlanningWithActions = Omit<CampusEventPlanningResponse, "ministries"> & {
	ministries: Array<
		Omit<CampusEventPlanningMinistry, "teams"> & { teams: CampusEventPlanningTeam[] }
	>
}

const http = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
	headers: { Accept: "application/json" },
})

http.interceptors.request.use((config) => {
	const accessToken = getStoredSession()?.accessToken
	if (accessToken !== undefined) config.headers.Authorization = `Bearer ${accessToken}`
	return config
})

const routeWithPathParams = (route: string, path: Record<string, unknown>) =>
	Object.entries(path).reduce(
		(resolvedRoute, [name, value]) =>
			resolvedRoute.replace(`{${name}}`, encodeURIComponent(String(value))),
		route,
	)

const requestOperation = async <TOperationId extends ApiClientOperationId>(
	operationId: TOperationId,
	input: Record<string, unknown> | undefined,
	config?: AxiosRequestConfig,
) => {
	const metadata = apiOperations[operationId]
	const requestInput = { ...input }
	const path: Record<string, unknown> = {}
	const query: Record<string, unknown> = {}

	for (const name of metadata.pathParams) {
		path[name] = requestInput[name]
		delete requestInput[name]
	}
	for (const name of metadata.queryParams) {
		if (requestInput[name] !== undefined) query[name] = requestInput[name]
		delete requestInput[name]
	}

	const response = await http.request({
		...config,
		data: metadata.hasBody ? requestInput : undefined,
		method: metadata.method,
		params: { ...config?.params, ...query },
		url: routeWithPathParams(metadata.route, path),
	})
	return response.data
}

const createTransport = () => {
	const methods: Partial<Record<ApiClientOperationId, unknown>> = {}
	for (const operationId of Object.keys(apiOperations) as ApiClientOperationId[]) {
		const metadata = apiOperations[operationId]
		methods[operationId] = (...args: [Record<string, unknown>?, AxiosRequestConfig?]) => {
			const hasInput =
				metadata.hasBody || metadata.pathParams.length > 0 || metadata.queryParams.length > 0
			return requestOperation(
				operationId,
				hasInput ? args[0] : undefined,
				hasInput ? args[1] : args[0],
			)
		}
	}
	return methods as ApiClientTransport
}

export const apiClient = decorateApiClient(createTransport())
