import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { useEffect } from "react"

import { appDependencies } from "@/app-dependencies"
import { AuthProvider, useAuth } from "@/auth"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { DevelopmentLocaleSwitcher, TranslationProvider } from "@/localization"
import { router } from "@/router"
import { SyncProvider } from "@/sync/sync-provider"
import { DevelopmentThemeSwitcher, ThemeProvider } from "@/theme"
import { Toaster } from "@/components/ui/sonner"

const ApplicationRouter = () => {
	const auth = useAuth()
	const accessToken = auth.session?.accessToken ?? null

	useEffect(() => {
		router.update({
			context: {
				apiClient: appDependencies.apiClient,
				auth,
				queryClient: appDependencies.queryClient,
			},
		})
		void router.invalidate()
	}, [auth])

	return (
		<SyncProvider accessToken={accessToken} queryClient={appDependencies.queryClient}>
			<RouterProvider
				context={{
					apiClient: appDependencies.apiClient,
					auth,
					queryClient: appDependencies.queryClient,
				}}
				router={router}
			/>
		</SyncProvider>
	)
}

export const App = () => (
	<QueryClientProvider client={appDependencies.queryClient}>
		<ThemeProvider>
			<TranslationProvider catalog={porphyraCatalog}>
				<AuthProvider>
					<ApplicationRouter />
				</AuthProvider>
				<DevelopmentLocaleSwitcher />
			</TranslationProvider>
			<DevelopmentThemeSwitcher />
			<Toaster />
		</ThemeProvider>
	</QueryClientProvider>
)
