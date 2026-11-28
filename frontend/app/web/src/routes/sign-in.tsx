import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"

import { Auth } from "@/components/auth"

type SignInSearch = {
	redirect?: string
}

const safeRedirect = (value: unknown) =>
	typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/app"

export const Route = createFileRoute("/sign-in")({
	validateSearch: (search): SignInSearch => ({
		redirect: safeRedirect(search.redirect),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ href: safeRedirect(search.redirect) })
		}
	},
	component: SignInRoute,
})

function SignInRoute() {
	const { auth } = Route.useRouteContext()
	const router = useRouter()
	const [email, setEmail] = useState("dev@a244.tech")
	const [error, setError] = useState(false)

	const signIn = async () => {
		setError(false)

		try {
			await auth.signIn({ email })
			await router.invalidate()
		} catch {
			setError(true)
		}
	}

	return (
		<Auth email={email} error={error} onEmailChange={setEmail} onSignIn={() => void signIn()} />
	)
}
