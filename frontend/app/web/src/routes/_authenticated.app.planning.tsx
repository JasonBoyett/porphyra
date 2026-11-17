import { createFileRoute } from "@tanstack/react-router"

import { PlanningScheduleBoard } from "@/features/planning"

export const Route = createFileRoute("/_authenticated/app/planning")({
	component: PlanningRoute,
})

function PlanningRoute() {
	const { accessToken } = Route.useRouteContext()
	return <PlanningScheduleBoard accessToken={accessToken} />
}
