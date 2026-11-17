import { createFileRoute } from "@tanstack/react-router"

import { VolunteerSchedule } from "@/features/volunteers"

export const Route = createFileRoute("/_authenticated/app/volunteers")({
	component: VolunteerSchedule,
})
