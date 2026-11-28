import { Building2, Users } from "lucide-react"

import { CampusListCard, NextStepsCard, SummaryCard } from "./workspace-sections"
import type { ChurchWorkspaceChurch } from "./types"

export const MultiCampusChurchView = ({ church }: { church: ChurchWorkspaceChurch }) => {
	const teamCount = church.ministries.reduce((count, ministry) => count + ministry.teams.length, 0)

	return (
		<>
			<section className="grid gap-4 sm:grid-cols-3">
				<SummaryCard
					icon={<Building2 />}
					label="churchWorkspace.campuses"
					value={church.campuses.length}
				/>
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
					description="churchWorkspace.campusDescription"
					title="churchWorkspace.campusTitle"
				/>
				<NextStepsCard firstStep="churchWorkspace.nextCampus" />
			</section>
		</>
	)
}
