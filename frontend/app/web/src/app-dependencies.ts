import { QueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/client"
import type { ApiClient } from "@/api/client-types"
import { getStoredSession } from "@/auth"
import type { AuthState } from "@/auth/types"
import { SyncManager } from "@/sync/sync-manager"

export type ApplicationDependencies = {
	apiClient: ApiClient
	auth?: AuthState
	dispose: () => void
	queryClient: QueryClient
}

type ApplicationDependencyOverrides = Partial<Omit<ApplicationDependencies, "dispose">> & {
	syncEnabled?: boolean
}

/**
 * Creates an application dependency set for an isolated render.
 *
 * Production uses the singleton below; callers that need isolation should
 * create and retain their own QueryClient rather than sharing this instance.
 */
export const createApplicationDependencies = (
	overrides: ApplicationDependencyOverrides = {},
): ApplicationDependencies => {
	const applicationApiClient = overrides.apiClient ?? apiClient
	const queryClient = overrides.queryClient ?? new QueryClient()
	const syncManager =
		overrides.syncEnabled === false
			? null
			: new SyncManager(queryClient, {
					apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
					getAccessToken: () => getStoredSession()?.accessToken ?? null,
					onAuthorizationChanged: (churchId) => {
						void queryClient.invalidateQueries({
							queryKey: applicationApiClient.getChurchPermissions.queryKey({
								church_id: churchId,
							}),
						})
					},
				})

	return {
		apiClient: applicationApiClient,
		auth: overrides.auth,
		dispose: () => syncManager?.dispose(),
		queryClient,
	}
}

export const appDependencies = createApplicationDependencies()
