import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { Welcome } from "@/components/welcome"

export const Route = createFileRoute("/")({
	component: WelcomeRoute,
})

function WelcomeRoute() {
	const navigate = useNavigate()

	return <Welcome onSignIn={() => void navigate({ to: "/sign-in" })} />
}
