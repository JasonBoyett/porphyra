import { createFileRoute } from "@tanstack/react-router"

import { PlanningScheduleBoard } from "@/features/planning"

export const Route = createFileRoute(
	"/_authenticated/app/planning/churches/$churchId/events/$eventId",
)({
	component: EventPlanningRoute,
})

function EventPlanningRoute() {
	const { eventId } = Route.useParams()
	const navigate = Route.useNavigate()

	return (
		<PlanningScheduleBoard
			eventId={eventId}
			onEventChange={(churchId, nextEventId) =>
				void navigate({
					params: { churchId, eventId: nextEventId },
					to: "/app/planning/churches/$churchId/events/$eventId",
				})
			}
		/>
	)
}
