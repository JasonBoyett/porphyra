import { createRouter } from "@tanstack/react-router"
import { describe, expect, it } from "vitest"

import { routeTree } from "@/routeTree.gen"

describe("church routes", () => {
	it("registers the authenticated entry and management URLs", () => {
		const router = createRouter({
			context: {
				apiClient: undefined!,
				auth: undefined!,
				queryClient: undefined!,
			},
			routeTree,
		})
		const churchRoutes = Object.keys(router.routesByPath)

		expect(churchRoutes).toContain("/church")
		expect(churchRoutes).toContain("/church/$churchId")
	})
})
