import { createRouter } from "@tanstack/react-router"

import { appDependencies } from "@/app-dependencies"
import { routeTree } from "@/routeTree.gen"

export const router = createRouter({
	context: {
		apiClient: appDependencies.apiClient,
		auth: undefined!,
		queryClient: appDependencies.queryClient,
	},
	routeTree,
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
