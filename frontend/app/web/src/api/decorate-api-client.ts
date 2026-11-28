import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AxiosRequestConfig } from "axios"
import { apiOperations, apiSyncResources } from "@porphyra/frontend/api/operations"

import { createSyncCallKey, forgetSyncCallKey, markSyncCallReconciled } from "@/sync/call-keys"
import type { SyncIdentity } from "@/sync/identity"
import type { ApiClient, ApiClientOperationId, ApiClientTransport } from "./client-types"
import type { ApiTag } from "./tags"

type RequestMethod = (...args: [unknown?, AxiosRequestConfig?]) => Promise<unknown>
type ResourceAction = {
	name: string
	operationId: ApiClientOperationId
	parameterBindings: Record<string, string>
}

const operationHasInput = (operationId: ApiClientOperationId) => {
	const operation = apiOperations[operationId]
	return operation.hasBody || operation.pathParams.length > 0 || operation.queryParams.length > 0
}

const operationKey = (operationId: ApiClientOperationId) => {
	const operation = apiOperations[operationId]
	return `${operation.method.toUpperCase()} ${operation.route}`
}

const valueAtInputPath = (input: unknown, path: string) => {
	const fields = path
		.replace(/^\$input\.?/, "")
		.split(".")
		.filter(Boolean)
	return fields.reduce<unknown>(
		(value, field) =>
			typeof value === "object" && value !== null
				? (value as Record<string, unknown>)[field]
				: undefined,
		input,
	)
}

const syncTargetsForInput = (operationId: ApiClientOperationId, input: unknown): SyncIdentity[] =>
	apiOperations[operationId].syncQueryTargets.flatMap((template) => {
		const identity = Object.fromEntries(
			Object.entries(template.identity).flatMap(([field, path]) => {
				const value = valueAtInputPath(input, path)
				return value === null ||
					typeof value === "string" ||
					typeof value === "number" ||
					typeof value === "boolean"
					? [[field, value]]
					: []
			}),
		)
		return Object.keys(identity).length === Object.keys(template.identity).length
			? [{ tag: template.tag, identity }]
			: []
	})

const invalidateTags = (queryClient: ReturnType<typeof useQueryClient>, tags: readonly ApiTag[]) =>
	void queryClient.invalidateQueries({
		predicate: (query) => {
			const queryTags = (query.meta as { syncTags?: readonly ApiTag[] } | undefined)?.syncTags ?? []
			return queryTags.some((tag) => tags.includes(tag))
		},
	})

const resourceActionsForView = (tag: string): ResourceAction[] => {
	const resource = apiSyncResources.find(
		(candidate) => candidate.kind === "resource" && candidate.tag === tag,
	)
	return resource?.kind === "resource" ? [...resource.actions] : []
}

export const decorateResourceViews = (
	data: unknown,
	operationId: ApiClientOperationId,
	runAction: (
		operationId: ApiClientOperationId,
		input: Record<string, unknown>,
	) => Promise<unknown>,
) => {
	const view = apiOperations[operationId].syncResourceViews.find(
		(candidate) => resourceActionsForView(candidate.tag).length > 0,
	)
	if (view === undefined) return data
	const actions = resourceActionsForView(view.tag)
	const decorateResource = (resource: unknown) => {
		if (typeof resource !== "object" || resource === null) return resource
		const value = { ...(resource as Record<string, unknown>) }
		Object.defineProperties(
			value,
			Object.fromEntries(
				actions.map((action) => [
					action.name,
					{
						enumerable: false,
						value: (input: Record<string, unknown> = {}) =>
							runAction(action.operationId, {
								...input,
								...Object.fromEntries(
									Object.entries(action.parameterBindings).map(([parameter, field]) => [
										parameter,
										value[field],
									]),
								),
							}),
					},
				]),
			),
		)
		return value
	}
	const parts =
		view.path === "$[]"
			? ["[]"]
			: view.path
					.replace(/^\$\.?/, "")
					.split(".")
					.filter(Boolean)
	const decorateAtPath = (value: unknown, partIndex: number): unknown => {
		if (partIndex === parts.length) return decorateResource(value)
		const part = parts[partIndex]
		if (part === "[]") {
			return Array.isArray(value) ? value.map((item) => decorateAtPath(item, partIndex + 1)) : value
		}
		if (typeof value !== "object" || value === null) return value
		const isArray = part.endsWith("[]")
		const key = isArray ? part.slice(0, -2) : part
		const source = value as Record<string, unknown>
		const child = source[key]
		const decoratedChild = isArray
			? Array.isArray(child)
				? child.map((item) => decorateAtPath(item, partIndex + 1))
				: child
			: decorateAtPath(child, partIndex + 1)
		return { ...source, [key]: decoratedChild }
	}
	return decorateAtPath(data, 0)
}

const decorateQuery = (
	operationId: ApiClientOperationId,
	request: RequestMethod,
	runAction: (
		operationId: ApiClientOperationId,
		input: Record<string, unknown>,
		queryContext?: string,
	) => Promise<unknown>,
) => {
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
			meta: {
				...options?.meta,
				syncTags: apiOperations[operationId].syncTags,
				syncResourceViews: apiOperations[operationId].syncResourceViews,
				syncTargets: syncTargetsForInput(operationId, input),
			},
			queryKey: queryKey(input),
			queryFn: ({ signal }: { signal: AbortSignal }) =>
				hasInput ? request(input, { signal }) : request({ signal }),
		}
	}
	const useQueryMethod = (...args: [unknown?, Record<string, unknown>?]) =>
		useQuery(queryOptions(...args))
	const useResourceQuery = (...args: [unknown?, Record<string, unknown>?]) => {
		const queryClient = useQueryClient()
		const result = useQuery(queryOptions(...args))
		const queryContext = JSON.stringify(queryKey(hasInput ? args[0] : undefined))
		const data = useMemo(
			() =>
				decorateResourceViews(result.data, operationId, async (actionOperationId, actionInput) => {
					const response = await runAction(actionOperationId, actionInput, queryContext)
					void queryClient.invalidateQueries({
						queryKey: JSON.parse(queryContext) as unknown[],
					})
					return response
				}),
			[queryClient, queryContext, result.data],
		)
		return { ...result, data }
	}
	return Object.assign(request, {
		queryKey,
		queryOptions,
		useQuery: useQueryMethod,
		useResourceQuery,
	})
}

const decorateMutation = (operationId: ApiClientOperationId, request: RequestMethod) => {
	const hasInput = operationHasInput(operationId)
	const mutationKey = [operationKey(operationId)] as const
	const useMutationMethod = (options?: { onSuccess?: (...args: unknown[]) => unknown }) => {
		const queryClient = useQueryClient()
		return useMutation({
			...options,
			mutationKey,
			mutationFn: (input: unknown) => {
				const callKey = createSyncCallKey()
				return (
					hasInput
						? request(input, { headers: { "X-Porphyra-Sync-Call-Key": callKey } })
						: request({ headers: { "X-Porphyra-Sync-Call-Key": callKey } })
				).catch((error) => {
					forgetSyncCallKey(callKey)
					throw error
				})
			},
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
	const runAction = async (
		operationId: ApiClientOperationId,
		input: Record<string, unknown>,
		queryContext?: string,
	) => {
		const callKey = createSyncCallKey(queryContext)
		const request = transport[operationId] as RequestMethod
		try {
			const response = await request(input, {
				headers: { "X-Porphyra-Sync-Call-Key": callKey },
			})
			if (queryContext !== undefined) markSyncCallReconciled(callKey, queryContext)
			return response
		} catch (error) {
			forgetSyncCallKey(callKey)
			throw error
		}
	}
	for (const operationId of Object.keys(apiOperations) as ApiClientOperationId[]) {
		const request = transport[operationId] as RequestMethod
		client[operationId] =
			apiOperations[operationId].method === "get"
				? decorateQuery(operationId, request, runAction)
				: decorateMutation(operationId, request)
	}
	return client as ApiClient
}
