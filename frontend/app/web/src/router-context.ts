import type { QueryClient } from "@tanstack/react-query"

import type { ApiClient } from "@/api/client-types"
import type { AuthState } from "@/auth/types"

export type RouterContext = {
	apiClient: ApiClient
	auth: AuthState
	queryClient: QueryClient
}
