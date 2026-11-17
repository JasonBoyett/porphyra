import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query"
import type {
	CampusEventListItem,
	CampusEventPlanningResponse,
	DashboardResponse,
	ScheduledVolunteerResponse,
	TeamRoleResponse,
	VolunteerAssignmentResponse,
	VolunteerRequestRosterResponse,
} from "@porphyra/frontend/api/types"
import { apiOperations } from "@porphyra/frontend/api/operations"

import { useSyncTags } from "../sync/sync-provider"
import type { ApiTag } from "./tags"

export type Dashboard = DashboardResponse
export type PlannedVolunteer = ScheduledVolunteerResponse
export type TeamRole = TeamRoleResponse
export type VolunteerRequestStatus = VolunteerRequestRosterResponse["status"]
export type VolunteerRequest = VolunteerRequestRosterResponse
export type VolunteerAssignment = VolunteerAssignmentResponse
export type CampusEventPlanning = CampusEventPlanningResponse

export type ApiRequestError = Error & {
	status: number
	detail: unknown
}

type DashboardInput = { accessToken: string }
type QueryOptions<TData, TKey extends readonly unknown[]> = Omit<
	UseQueryOptions<TData, Error, TData, TKey>,
	"meta" | "queryFn" | "queryKey"
> & {
	meta?: Record<string, unknown>
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

const getDashboard = async (input: DashboardInput, signal: AbortSignal): Promise<Dashboard> => {
	const response = await fetch(`${apiUrl}/api/v1/dashboard`, {
		headers: { Authorization: `Bearer ${input.accessToken}` },
		signal,
	})
	if (!response.ok) throw new Error("Unable to reach Porphyra API")
	return response.json() as Promise<Dashboard>
}

const apiRequest = async <TData>(
	path: string,
	accessToken: string,
	signal?: AbortSignal,
	init?: RequestInit,
): Promise<TData> => {
	const response = await fetch(`${apiUrl}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			...init?.headers,
		},
		signal,
	})
	if (!response.ok) {
		const detail = await response.json().catch(() => null)
		const error = Object.assign(new Error("Unable to complete the request."), {
			detail,
			status: response.status,
		}) as ApiRequestError
		throw error
	}
	return response.json() as Promise<TData>
}

const getCampusEvents = (input: { accessToken: string }, signal: AbortSignal) =>
	apiRequest<CampusEventListItem[]>("/api/v1/events/campus/", input.accessToken, signal)

const getCampusEventPlanning = (
	input: { accessToken: string; eventId: string },
	signal: AbortSignal,
) =>
	apiRequest<CampusEventPlanning>(
		`/api/v1/events/campus/${input.eventId}`,
		input.accessToken,
		signal,
	)

const getMyVolunteerRequests = (input: { accessToken: string }, signal: AbortSignal) =>
	apiRequest<VolunteerRequest[]>(
		"/api/v1/events/campus/volunteer-requests",
		input.accessToken,
		signal,
	)

const assignCampusEventVolunteer = (input: {
	accessToken: string
	eventTeamId: string
	replacementRequestId?: string
	teamMembershipId: string
	roleName: string
	roleEmoji: string | null
}): Promise<VolunteerAssignment> =>
	apiRequest<VolunteerAssignment>(
		input.replacementRequestId === undefined
			? `/api/v1/events/campus/${input.eventTeamId}/volunteers`
			: `/api/v1/events/campus/${input.eventTeamId}/volunteer-requests/${input.replacementRequestId}/replacement`,
		input.accessToken,
		undefined,
		{
			body: JSON.stringify({
				roleEmoji: input.roleEmoji,
				roleName: input.roleName,
				teamMembershipId: input.teamMembershipId,
			}),
			method: "POST",
		},
	)

const changeCampusEventVolunteerRole = (input: {
	accessToken: string
	eventTeamId: string
	volunteerId: string
	roleName: string
	roleEmoji: string | null
}) =>
	apiRequest(
		`/api/v1/events/campus/${input.eventTeamId}/volunteers/role/${input.volunteerId}`,
		input.accessToken,
		undefined,
		{
			body: JSON.stringify({
				roleEmoji: input.roleEmoji,
				roleName: input.roleName,
			}),
			method: "POST",
		},
	)

const dropCampusEventVolunteer = (input: {
	accessToken: string
	eventTeamId: string
	volunteerId: string
}) =>
	apiRequest(
		`/api/v1/events/campus/${input.eventTeamId}/volunteers/drop/${input.volunteerId}`,
		input.accessToken,
		undefined,
		{ method: "POST" },
	)

const respondToVolunteerRequest = (input: {
	accessToken: string
	eventTeamId: string
	requestId: string
	response: "accept" | "decline"
}) =>
	apiRequest(
		`/api/v1/events/campus/${input.eventTeamId}/volunteer-requests/${input.requestId}/${input.response}`,
		input.accessToken,
		undefined,
		{ method: "POST" },
	)

const defineQueryOperation = <TInput, TData, const TTags extends readonly ApiTag[]>(operation: {
	key: string
	request: (input: TInput, signal: AbortSignal) => Promise<TData>
	syncTags: TTags
}) => {
	type QueryKey = readonly [string, TInput]
	const queryKey = (input: TInput): QueryKey => [operation.key, input]
	const queryOptions = (input: TInput, options?: QueryOptions<TData, QueryKey>) => ({
		...options,
		meta: { ...options?.meta, syncTags: operation.syncTags },
		queryKey: queryKey(input),
		queryFn: ({ signal }: { signal: AbortSignal }) => operation.request(input, signal),
	})
	const useOperationQuery = (input: TInput, options?: QueryOptions<TData, QueryKey>) =>
		useQuery(queryOptions(input, options))
	const useOperationSyncQuery = (input: TInput, options?: QueryOptions<TData, QueryKey>) => {
		useSyncTags(operation.syncTags)
		return useQuery(queryOptions(input, options))
	}

	return {
		queryKey,
		queryOptions,
		useQuery: useOperationQuery,
		useSyncQuery: useOperationSyncQuery,
	}
}

const defineMutationOperation = <TInput, TData, const TTags extends readonly ApiTag[]>(operation: {
	request: (input: TInput) => Promise<TData>
	syncTags: TTags
}) => {
	const useOperationMutation = () => {
		const queryClient = useQueryClient()
		return useMutation({
			mutationFn: operation.request,
			onSuccess: () =>
				void queryClient.invalidateQueries({
					predicate: (query) => {
						const meta = query.meta as { syncTags?: readonly ApiTag[] } | undefined
						return meta?.syncTags?.some((tag) => operation.syncTags.includes(tag)) ?? false
					},
				}),
		})
	}
	return { useMutation: useOperationMutation }
}

export const apiClient = {
	dashboard: defineQueryOperation({
		key: `GET ${apiOperations.getDashboard.route}`,
		request: getDashboard,
		syncTags: apiOperations.getDashboard.syncTags,
	}),
	campusEvents: defineQueryOperation({
		key: `GET ${apiOperations.getCampusEvents.route}`,
		request: getCampusEvents,
		syncTags: apiOperations.getCampusEvents.syncTags,
	}),
	campusEventPlanning: defineQueryOperation({
		key: `GET ${apiOperations.getCampusEventPlanning.route}`,
		request: getCampusEventPlanning,
		syncTags: apiOperations.getCampusEventPlanning.syncTags,
	}),
	myVolunteerRequests: defineQueryOperation({
		key: `GET ${apiOperations.getMyVolunteerRequests.route}`,
		request: getMyVolunteerRequests,
		syncTags: apiOperations.getMyVolunteerRequests.syncTags,
	}),
	assignCampusEventVolunteer: defineMutationOperation({
		request: assignCampusEventVolunteer,
		syncTags: apiOperations.assignCampusEventVolunteer.syncTags,
	}),
	changeCampusEventVolunteerRole: defineMutationOperation({
		request: changeCampusEventVolunteerRole,
		syncTags: apiOperations.changeCampusEventVolunteerRole.syncTags,
	}),
	dropCampusEventVolunteer: defineMutationOperation({
		request: dropCampusEventVolunteer,
		syncTags: apiOperations.dropCampusEventVolunteer.syncTags,
	}),
	acceptVolunteerRequest: defineMutationOperation({
		request: (input: { accessToken: string; eventTeamId: string; requestId: string }) =>
			respondToVolunteerRequest({ ...input, response: "accept" }),
		syncTags: apiOperations.acceptVolunteerRequest.syncTags,
	}),
	declineVolunteerRequest: defineMutationOperation({
		request: (input: { accessToken: string; eventTeamId: string; requestId: string }) =>
			respondToVolunteerRequest({ ...input, response: "decline" }),
		syncTags: apiOperations.declineVolunteerRequest.syncTags,
	}),
}
