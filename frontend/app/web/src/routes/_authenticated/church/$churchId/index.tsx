import { createFileRoute } from "@tanstack/react-router"
import { Building2 } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ComputedText, Localized, LocalizationScope } from "@/localization"

export const Route = createFileRoute("/_authenticated/church/$churchId/")({
	component: ChurchManagementRoute,
})

function ChurchManagementRoute() {
	const { churchId } = Route.useParams()

	return (
		<LocalizationScope name="church-management">
			<main className="mx-auto max-w-4xl px-6 py-12">
				<Empty className="min-h-80 border bg-card">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Building2 />
						</EmptyMedia>
						<EmptyTitle>
							<Localized str="churchOnboarding.managementTitle" />
						</EmptyTitle>
						<EmptyDescription>
							<Localized str="churchOnboarding.managementDescription" />{" "}
							<ComputedText value={churchId} />
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</main>
		</LocalizationScope>
	)
}
