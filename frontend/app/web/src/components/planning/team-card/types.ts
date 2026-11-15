import type { CampusEventPlanning } from "../../../api/client"
import type { PlanningTeam } from "../planning-schedule-board/types"

export type TeamCardProps = {
	accessToken: string
	event: CampusEventPlanning
	onSchedule: () => void
	team: PlanningTeam
}
