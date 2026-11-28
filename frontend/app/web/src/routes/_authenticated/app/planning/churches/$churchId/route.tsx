import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/app/planning/churches/$churchId")({
	component: Outlet,
})
