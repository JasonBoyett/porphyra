import { createFileRoute } from "@tanstack/react-router"

import { PlanningScheduleBoard } from "@/features/planning"

export const Route = createFileRoute(
	"/_authenticated/app/planning/churches/$churchId/events/$eventId",
)({
	component: EventPlanningRoute,
})

function EventPlanningRoute() {
	const { eventId } = Route.useParams()
	const { accessToken } = Route.useRouteContext()
	return <PlanningScheduleBoard accessToken={accessToken} eventId={eventId} />
}
