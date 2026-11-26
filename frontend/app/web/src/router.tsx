import { createRouter } from "@tanstack/react-router"

import { appDependencies, type ApplicationDependencies } from "@/app-dependencies"
import { routeTree } from "@/routeTree.gen"

export const createAppRouter = (dependencies: ApplicationDependencies) =>
	createRouter({
		context: {
			apiClient: dependencies.apiClient,
			auth: undefined!,
			queryClient: dependencies.queryClient,
		},
		routeTree,
	})

export const router = createAppRouter(appDependencies)

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
