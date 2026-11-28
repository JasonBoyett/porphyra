import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"

import { AppShell } from "@/components/app-shell"

export const Route = createFileRoute("/_authenticated/app")({
	component: AppLayout,
})

function AppLayout() {
	const { apiClient, auth, queryClient } = Route.useRouteContext()
	const navigate = useNavigate()
	const dashboard = apiClient.getDashboard.useQuery()

	const handleSignOut = () => {
		auth.signOut()
		queryClient.clear()
		void navigate({ to: "/", replace: true })
	}

	return (
		<AppShell
			onSignOut={handleSignOut}
			viewer={{ avatarUrl: dashboard.data?.viewer.avatarUrl, name: dashboard.data?.viewer.name }}
		>
			<Outlet />
		</AppShell>
	)
}
