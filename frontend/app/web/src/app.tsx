import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"

import { appDependencies, type ApplicationDependencies } from "@/app-dependencies"
import { AuthProvider, useAuth } from "@/auth"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { DevelopmentLocaleSwitcher, LocalizationScope, TranslationProvider } from "@/localization"
import { createAppRouter, router } from "@/router"
import { SyncProvider } from "@/sync/sync-provider"
import { DevelopmentThemeSwitcher, ThemeProvider } from "@/theme"
import { Toaster } from "@/components/ui/sonner"

type ApplicationRouterProps = {
	dependencies: ApplicationDependencies
	router: ReturnType<typeof createAppRouter>
}

const ApplicationRouter = ({ dependencies, router: applicationRouter }: ApplicationRouterProps) => {
	const auth = useAuth()
	const accessToken = auth.session?.accessToken ?? null

	useEffect(() => {
		applicationRouter.update({
			context: {
				apiClient: dependencies.apiClient,
				auth,
				queryClient: dependencies.queryClient,
			},
		})
		void applicationRouter.invalidate()
	}, [applicationRouter, auth, dependencies])

	return (
		<SyncProvider
			accessToken={accessToken}
			enabled={dependencies.syncEnabled}
			queryClient={dependencies.queryClient}
		>
			<RouterProvider
				context={{
					apiClient: dependencies.apiClient,
					auth,
					queryClient: dependencies.queryClient,
				}}
				router={applicationRouter}
			/>
		</SyncProvider>
	)
}

export type AppProps = {
	dependencies?: ApplicationDependencies
	localizationTest?: boolean
}

export const App = ({ dependencies = appDependencies, localizationTest = false }: AppProps) => {
	const applicationRouter = useMemo(
		() => (dependencies === appDependencies ? router : createAppRouter(dependencies)),
		[dependencies],
	)

	return (
		<QueryClientProvider client={dependencies.queryClient}>
			<ThemeProvider>
				<TranslationProvider catalog={porphyraCatalog} localizationTest={localizationTest}>
					<AuthProvider auth={dependencies.auth}>
						<ApplicationRouter dependencies={dependencies} router={applicationRouter} />
					</AuthProvider>
					<LocalizationScope name="development-locale-switcher">
						<DevelopmentLocaleSwitcher />
					</LocalizationScope>
				</TranslationProvider>
				<DevelopmentThemeSwitcher />
				<Toaster />
			</ThemeProvider>
		</QueryClientProvider>
	)
}
