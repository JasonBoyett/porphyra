import type { QueryClient } from "@tanstack/react-query"

import type { apiClient } from "@/api/client"
import type { AuthState } from "@/auth/types"

export type RouterContext = {
	apiClient: typeof apiClient
	auth: AuthState
	queryClient: QueryClient
}
