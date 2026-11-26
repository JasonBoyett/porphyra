import { createFileRoute, Link } from "@tanstack/react-router"

import { Localized, LocalizationScope } from "@/localization"

export const Route = createFileRoute("/_authenticated/app/planning/")({
	component: ChurchPickerRoute,
})

function ChurchPickerRoute() {
	const { apiClient } = Route.useRouteContext()
	const dashboard = apiClient.getDashboard.useSyncQuery()
	const events = apiClient.getCampusEvents.useSyncQuery()

	return (
		<LocalizationScope name="planning">
			<main className="mx-auto max-w-5xl px-6 py-12">
				<h1 className="font-serif text-3xl font-bold">
					<Localized str="navigation.planning" />
				</h1>
				{events.data?.length === 0 ? (
					<p className="mt-6"><Localized str="planning.noEvents" /></p>
				) : null}
				<div className="mt-6 grid gap-3 sm:grid-cols-2">
					{dashboard.data?.churches.map((church) => (
						<Link
							className="rounded-lg border bg-card p-5 font-semibold transition-colors hover:bg-secondary"
							key={church.id}
							params={{ churchId: church.id }}
							to="/app/planning/churches/$churchId"
						>
							{church.name}
						</Link>
					))}
				</div>
			</main>
		</LocalizationScope>
	)
}
