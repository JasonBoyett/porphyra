import { QueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/client"
import type { ApiClient } from "@/api/client-types"
import type { AuthState } from "@/auth/types"

export type ApplicationDependencies = {
	apiClient: ApiClient
	auth?: AuthState
	queryClient: QueryClient
	syncEnabled?: boolean
}

/**
 * Creates an application dependency set for an isolated render.
 *
 * Production uses the singleton below; callers that need isolation should
 * create and retain their own QueryClient rather than sharing this instance.
 */
export const createApplicationDependencies = (
	overrides: Partial<ApplicationDependencies> = {},
): ApplicationDependencies => ({
	apiClient: overrides.apiClient ?? apiClient,
	auth: overrides.auth,
	queryClient: overrides.queryClient ?? new QueryClient(),
	syncEnabled: overrides.syncEnabled ?? true,
})

export const appDependencies: ApplicationDependencies = {
	apiClient,
	queryClient: new QueryClient(),
	syncEnabled: true,
}
