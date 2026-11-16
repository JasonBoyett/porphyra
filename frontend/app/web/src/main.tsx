import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
	createRootRoute,
	createRoute,
	createRouter,
	Navigate,
	Outlet,
	RouterProvider,
	useNavigate,
} from "@tanstack/react-router"
import { createContext, useContext, useState } from "react"
import { createRoot } from "react-dom/client"
import "../../../lib/theme/globals.css"
import "../../../lib/theme/porphyra.css"
import "./styles.css"
import { apiClient } from "@/api/client"
import { AppShell } from "@/components/app-shell"
import { Auth } from "@/components/auth"
import { Dashboard } from "@/components/dashboard"
import { Kiosk } from "@/components/kiosk"
import { Welcome } from "@/components/welcome"
import { PlanningScheduleBoard } from "@/features/planning"
import { VolunteerSchedule } from "@/features/volunteers"
import { SyncProvider } from "@/sync/sync-provider"
import { DevelopmentThemeSwitcher, ThemeProvider } from "@/theme"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import {
	DevelopmentLocaleSwitcher,
	LocalizationScope,
	TranslationProvider,
	useLocalizedString,
} from "@/localization"

type AuthContextValue = {
	accessToken: string | null
	completeAuthentication: (accessToken: string) => void
	signOut: () => void
}

const queryClient = new QueryClient()
const authContext = createContext<AuthContextValue | null>(null)
const authUrl = "http://localhost:4000"

const useAuth = () => {
	const auth = useContext(authContext)
	if (auth === null) throw new Error("Authentication context is unavailable")
	return auth
}

const DashboardView = () => {
	const { accessToken } = useAuth()
	if (accessToken === null) return <Navigate to="/sign-in" />

	const dashboard = apiClient.dashboard.useSyncQuery({ accessToken })
	const churches = dashboard.data?.churches ?? []

	return (
		<Dashboard
			churches={churches}
			isError={dashboard.isError}
			isLoading={dashboard.isLoading}
			viewerName={dashboard.data?.viewer.name}
		/>
	)
}

const PlanningView = () => {
	const { accessToken } = useAuth()
	if (accessToken === null) return <Navigate to="/sign-in" />
	return <PlanningScheduleBoard accessToken={accessToken} />
}

const AppLayout = () => {
	const { accessToken, signOut } = useAuth()
	const navigate = useNavigate()
	const dashboard = apiClient.dashboard.useSyncQuery(
		{ accessToken: accessToken ?? "" },
		{ enabled: accessToken !== null },
	)

	if (accessToken === null) return <Navigate to="/sign-in" />

	const handleSignOut = () => {
		signOut()
		void navigate({ to: "/" })
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

const WelcomeView = () => {
	const navigate = useNavigate()
	return <Welcome onSignIn={() => void navigate({ to: "/sign-in" })} />
}

const AuthScreen = () => {
	const { completeAuthentication } = useAuth()
	const navigate = useNavigate()
	const [email, setEmail] = useState("dev@a244.tech")
	const [error, setError] = useState(false)

	const signIn = async () => {
		setError(false)
		const response = await fetch(`${authUrl}/api/v1/auth/sign-in`, {
			body: JSON.stringify({ email }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})
		if (!response.ok) {
			setError(true)
			return
		}
		const data = (await response.json()) as { accessToken: string }
		completeAuthentication(data.accessToken)
		await navigate({ to: "/app" })
	}

	return (
		<Auth email={email} error={error} onEmailChange={setEmail} onSignIn={() => void signIn()} />
	)
}

const KioskView = () => {
	return (
		<LocalizationScope name="kiosk">
			<KioskContent />
		</LocalizationScope>
	)
}

const KioskContent = () => {
	const { text: description } = useLocalizedString("kiosk.description")
	const { text: title } = useLocalizedString("kiosk.title")
	return <Kiosk description={description} title={title} />
}

const rootRoute = createRootRoute({ component: Outlet })
const welcomeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: WelcomeView,
})
const signInRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "sign-in",
	component: AuthScreen,
})
const appRoute = createRoute({ getParentRoute: () => rootRoute, path: "app", component: AppLayout })
const appIndexRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/",
	component: DashboardView,
})
const planningRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "planning",
	component: PlanningView,
})
const volunteerRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "volunteers",
	component: VolunteerSchedule,
})
const kioskRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "kiosk",
	component: KioskView,
})

const routeTree = rootRoute.addChildren([
	welcomeRoute,
	signInRoute,
	appRoute.addChildren([appIndexRoute, planningRoute, volunteerRoute, kioskRoute]),
])
const router = createRouter({ routeTree })

const Application = () => {
	const [accessToken, setAccessToken] = useState(() =>
		sessionStorage.getItem("porphyra-access-token"),
	)
	const auth = {
		accessToken,
		completeAuthentication: (token: string) => {
			sessionStorage.setItem("porphyra-access-token", token)
			setAccessToken(token)
		},
		signOut: () => {
			sessionStorage.removeItem("porphyra-access-token")
			setAccessToken(null)
		},
	}

	return (
		<ThemeProvider>
			<TranslationProvider catalog={porphyraCatalog}>
				<authContext.Provider value={auth}>
					<SyncProvider accessToken={accessToken} queryClient={queryClient}>
						<RouterProvider router={router} />
					</SyncProvider>
				</authContext.Provider>
				<DevelopmentLocaleSwitcher />
			</TranslationProvider>
			<DevelopmentThemeSwitcher />
		</ThemeProvider>
	)
}

createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={queryClient}>
		<Application />
	</QueryClientProvider>,
)
