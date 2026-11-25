import type {
	QueryFunction,
	UseMutationOptions,
	UseMutationResult,
	UseQueryOptions,
	UseQueryResult,
} from "@tanstack/react-query"
import type { AxiosRequestConfig } from "axios"
import type { apiOperations } from "@porphyra/frontend/api/operations"
import type { ApiOperationInput, ApiOperationResponse } from "@porphyra/frontend/api/types"

export type ApiClientOperationId = keyof typeof apiOperations

type HasInput<TOperationId extends ApiClientOperationId> =
	(typeof apiOperations)[TOperationId]["hasBody"] extends true
		? true
		: (typeof apiOperations)[TOperationId]["pathParams"] extends readonly []
			? (typeof apiOperations)[TOperationId]["queryParams"] extends readonly []
				? false
				: true
			: true

type ApiRequestMethod<TOperationId extends ApiClientOperationId> =
	HasInput<TOperationId> extends true
		? (
				input: ApiOperationInput<TOperationId>,
				config?: AxiosRequestConfig,
			) => Promise<ApiOperationResponse<TOperationId>>
		: (config?: AxiosRequestConfig) => Promise<ApiOperationResponse<TOperationId>>

export type ApiClientTransport = {
	[TOperationId in ApiClientOperationId]: ApiRequestMethod<TOperationId>
}

type ApiOperationKey<TOperationId extends ApiClientOperationId> =
	`${Uppercase<(typeof apiOperations)[TOperationId]["method"]>} ${(typeof apiOperations)[TOperationId]["route"]}`

type ApiQueryKey<TOperationId extends ApiClientOperationId> =
	HasInput<TOperationId> extends true
		? readonly [ApiOperationKey<TOperationId>, ApiOperationInput<TOperationId>]
		: readonly [ApiOperationKey<TOperationId>]

type ApiQueryOptions<TOperationId extends ApiClientOperationId, TSelected> = Omit<
	UseQueryOptions<ApiOperationResponse<TOperationId>, Error, TSelected, ApiQueryKey<TOperationId>>,
	"queryKey" | "queryFn"
>

type ApiQueryOptionsResult<TOperationId extends ApiClientOperationId, TSelected> = ApiQueryOptions<
	TOperationId,
	TSelected
> & {
	queryKey: ApiQueryKey<TOperationId>
	queryFn: QueryFunction<ApiOperationResponse<TOperationId>, ApiQueryKey<TOperationId>>
}

type ApiQueryMembers<TOperationId extends ApiClientOperationId> =
	HasInput<TOperationId> extends true
		? {
				queryKey: (input: ApiOperationInput<TOperationId>) => ApiQueryKey<TOperationId>
				queryOptions: <TSelected = ApiOperationResponse<TOperationId>>(
					input: ApiOperationInput<TOperationId>,
					options?: ApiQueryOptions<TOperationId, TSelected>,
				) => ApiQueryOptionsResult<TOperationId, TSelected>
				useQuery: <TSelected = ApiOperationResponse<TOperationId>>(
					input: ApiOperationInput<TOperationId>,
					options?: ApiQueryOptions<TOperationId, TSelected>,
				) => UseQueryResult<TSelected, Error>
				useResourceQuery: <TSelected = ApiOperationResponse<TOperationId>>(
					input: ApiOperationInput<TOperationId>,
					options?: ApiQueryOptions<TOperationId, TSelected>,
				) => UseQueryResult<TSelected, Error>
			}
		: {
				queryKey: () => ApiQueryKey<TOperationId>
				queryOptions: <TSelected = ApiOperationResponse<TOperationId>>(
					options?: ApiQueryOptions<TOperationId, TSelected>,
				) => ApiQueryOptionsResult<TOperationId, TSelected>
				useQuery: <TSelected = ApiOperationResponse<TOperationId>>(
					options?: ApiQueryOptions<TOperationId, TSelected>,
				) => UseQueryResult<TSelected, Error>
				useResourceQuery: <TSelected = ApiOperationResponse<TOperationId>>(
					options?: ApiQueryOptions<TOperationId, TSelected>,
				) => UseQueryResult<TSelected, Error>
			}

type ApiSyncQueryMember<TOperationId extends ApiClientOperationId> =
	(typeof apiOperations)[TOperationId]["syncTags"] extends readonly []
		? {}
		: HasInput<TOperationId> extends true
			? {
					useSyncQuery: <TSelected = ApiOperationResponse<TOperationId>>(
						input: ApiOperationInput<TOperationId>,
						options?: ApiQueryOptions<TOperationId, TSelected>,
					) => UseQueryResult<TSelected, Error>
				}
			: {
					useSyncQuery: <TSelected = ApiOperationResponse<TOperationId>>(
						options?: ApiQueryOptions<TOperationId, TSelected>,
					) => UseQueryResult<TSelected, Error>
				}

type ApiMutationMembers<TOperationId extends ApiClientOperationId> = {
	mutationKey: readonly [ApiOperationKey<TOperationId>]
	mutationOptions: (
		options?: Omit<
			UseMutationOptions<
				ApiOperationResponse<TOperationId>,
				Error,
				HasInput<TOperationId> extends true ? ApiOperationInput<TOperationId> : void
			>,
			"mutationKey" | "mutationFn"
		>,
	) => UseMutationOptions<
		ApiOperationResponse<TOperationId>,
		Error,
		HasInput<TOperationId> extends true ? ApiOperationInput<TOperationId> : void
	>
	useMutation: (
		options?: Omit<
			UseMutationOptions<
				ApiOperationResponse<TOperationId>,
				Error,
				HasInput<TOperationId> extends true ? ApiOperationInput<TOperationId> : void
			>,
			"mutationKey" | "mutationFn"
		>,
	) => UseMutationResult<
		ApiOperationResponse<TOperationId>,
		Error,
		HasInput<TOperationId> extends true ? ApiOperationInput<TOperationId> : void
	>
}

export type ApiClient = {
	[
		TOperationId in ApiClientOperationId
	]: (typeof apiOperations)[TOperationId]["method"] extends "get"
		? ApiRequestMethod<TOperationId> &
				ApiQueryMembers<TOperationId> &
				ApiSyncQueryMember<TOperationId>
		: ApiRequestMethod<TOperationId> & ApiMutationMembers<TOperationId>
}
