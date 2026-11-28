import { MapPin, Users } from "lucide-react"

import { CampusListCard, NextStepsCard, SummaryCard } from "./workspace-sections"
import type { ChurchWorkspaceChurch } from "./types"

export const SingleCampusChurchView = ({ church }: { church: ChurchWorkspaceChurch }) => {
	const teamCount = church.ministries.reduce((count, ministry) => count + ministry.teams.length, 0)

	return (
		<>
			<section className="grid gap-4 sm:grid-cols-3">
				<SummaryCard icon={<MapPin />} label="churchWorkspace.locations" value={1} />
				<SummaryCard
					icon={<Users />}
					label="churchWorkspace.ministries"
					value={church.ministries.length}
				/>
				<SummaryCard icon={<Users />} label="churchWorkspace.teams" value={teamCount} />
			</section>

			<section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
				<CampusListCard
					campuses={church.campuses}
					description="churchWorkspace.singleLocationDescription"
					title="churchWorkspace.singleLocationTitle"
				/>
				<NextStepsCard firstStep="churchWorkspace.nextLocation" />
			</section>
		</>
	)
}
