import { createFileRoute, Link } from "@tanstack/react-router"

import { ComputedText, Localized, LocalizationScope } from "@/localization"

export const Route = createFileRoute("/_authenticated/app/planning/churches/$churchId/")({
	component: ChurchEventsRoute,
})

function ChurchEventsRoute() {
	const { churchId } = Route.useParams()
	const { apiClient } = Route.useRouteContext()
	const events = apiClient.getCampusEvents.useQuery()
	const churchEvents = (events.data ?? [])
		.filter((event) => event.churchId === churchId)
		.sort((left, right) => left.startsAt.localeCompare(right.startsAt))

	return (
		<LocalizationScope name="planning">
			<main className="mx-auto max-w-5xl px-6 py-12">
				<h1 className="font-serif text-3xl font-bold">
					<Localized str="navigation.planning" />
				</h1>
				<div className="mt-6 space-y-3">
					{churchEvents.map((event) => (
						<Link
							className="block rounded-lg border bg-card p-5 transition-colors hover:bg-secondary"
							key={event.id}
							params={{ churchId, eventId: event.id }}
							to="/app/planning/churches/$churchId/events/$eventId"
						>
							<p className="font-semibold">
								<ComputedText value={event.title} />
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								<ComputedText value={event.startsAt} />
							</p>
						</Link>
					))}
				</div>
			</main>
		</LocalizationScope>
	)
}
