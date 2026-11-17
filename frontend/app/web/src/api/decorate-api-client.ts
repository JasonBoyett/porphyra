import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AxiosRequestConfig } from "axios"
import { apiOperations } from "@porphyra/frontend/api/operations"

import { useSyncTags } from "@/sync/sync-provider"
import type { ApiClient, ApiClientOperationId, ApiClientTransport } from "./client-types"
import type { ApiTag } from "./tags"

type RequestMethod = (...args: [unknown?, AxiosRequestConfig?]) => Promise<unknown>

const operationHasInput = (operationId: ApiClientOperationId) => {
	const operation = apiOperations[operationId]
	return operation.hasBody || operation.pathParams.length > 0 || operation.queryParams.length > 0
}

const operationKey = (operationId: ApiClientOperationId) => {
	const operation = apiOperations[operationId]
	return `${operation.method.toUpperCase()} ${operation.route}`
}

const invalidateTags = (queryClient: ReturnType<typeof useQueryClient>, tags: readonly ApiTag[]) =>
	void queryClient.invalidateQueries({
		predicate: (query) => {
			const queryTags = (query.meta as { syncTags?: readonly ApiTag[] } | undefined)?.syncTags ?? []
			return queryTags.some((tag) => tags.includes(tag))
		},
	})

const decorateQuery = (operationId: ApiClientOperationId, request: RequestMethod) => {
	const hasInput = operationHasInput(operationId)
	const key = operationKey(operationId)
	const queryKey = (input?: unknown) =>
		input === undefined ? ([key] as const) : ([key, input] as const)
	const queryOptions = (...args: [unknown?, Record<string, unknown>?]) => {
		const input = hasInput ? args[0] : undefined
		const options = (hasInput ? args[1] : args[0]) as
			(Record<string, unknown> & { meta?: Record<string, unknown> }) | undefined
		return {
			...options,
			meta: { ...options?.meta, syncTags: apiOperations[operationId].syncTags },
			queryKey: queryKey(input),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				hasInput ? request(input, { signal }) : request({ signal }),
		}
	}
	const useQueryMethod = (...args: [unknown?, Record<string, unknown>?]) =>
		useQuery(queryOptions(...args))
	const useSyncQuery = (...args: [unknown?, Record<string, unknown>?]) => {
		useSyncTags(apiOperations[operationId].syncTags)
		return useQuery(queryOptions(...args))
	}
	return Object.assign(request, { queryKey, queryOptions, useQuery: useQueryMethod, useSyncQuery })
}

const decorateMutation = (operationId: ApiClientOperationId, request: RequestMethod) => {
	const hasInput = operationHasInput(operationId)
	const mutationKey = [operationKey(operationId)] as const
	const useMutationMethod = (options?: { onSuccess?: (...args: unknown[]) => unknown }) => {
		const queryClient = useQueryClient()
		return useMutation({
			...options,
			mutationKey,
			mutationFn: (input: unknown) => (hasInput ? request(input) : request()),
			onSuccess: (...args) => {
				invalidateTags(queryClient, apiOperations[operationId].syncTags)
				options?.onSuccess?.(...args)
			},
		})
	}
	return Object.assign(request, {
		mutationKey,
		mutationOptions: () => ({ mutationKey }),
		useMutation: useMutationMethod,
	})
}

export const decorateApiClient = (transport: ApiClientTransport): ApiClient => {
	const client: Partial<Record<ApiClientOperationId, unknown>> = {}
	for (const operationId of Object.keys(apiOperations) as ApiClientOperationId[]) {
		const request = transport[operationId] as RequestMethod
		client[operationId] =
			apiOperations[operationId].method === "get"
				? decorateQuery(operationId, request)
				: decorateMutation(operationId, request)
	}
	return client as ApiClient
}
