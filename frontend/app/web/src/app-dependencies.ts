import { QueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/client"

export const appDependencies = {
	apiClient,
	queryClient: new QueryClient(),
}
