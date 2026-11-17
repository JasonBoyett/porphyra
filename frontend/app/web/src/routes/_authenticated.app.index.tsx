import { createFileRoute } from "@tanstack/react-router"

import { Dashboard } from "@/components/dashboard"

export const Route = createFileRoute("/_authenticated/app/")({
	component: DashboardRoute,
})

function DashboardRoute() {
	const { accessToken, apiClient } = Route.useRouteContext()
	const dashboard = apiClient.getDashboard.useSyncQuery()
	const churches = dashboard.data?.churches ?? []

	return (
		<Dashboard
			churches={churches}
			isError={dashboard.isError}
			isLoading={dashboard.isLoading}
			viewerName={dashboard.data?.viewer.name}
		/>
	)
}
