import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		if (context.auth.session === null) {
			throw redirect({
				replace: true,
				search: { redirect: location.href },
				to: "/sign-in",
			})
		}

		return { accessToken: context.auth.session.accessToken }
	},
	component: Outlet,
})
