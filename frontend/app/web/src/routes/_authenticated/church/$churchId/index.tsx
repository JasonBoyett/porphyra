import { createFileRoute } from "@tanstack/react-router"

import { ChurchWorkspace } from "@/components/church-workspace"

export const Route = createFileRoute("/_authenticated/church/$churchId/")({
	component: ChurchManagementRoute,
})

function ChurchManagementRoute() {
	const { churchId } = Route.useParams()
	const { apiClient } = Route.useRouteContext()
	const dashboard = apiClient.getDashboard.useQuery()
	const church = dashboard.data?.churches.find((candidate) => candidate.id === churchId)

	return (
		<ChurchWorkspace church={church} isError={dashboard.isError} isLoading={dashboard.isLoading} />
	)
}
