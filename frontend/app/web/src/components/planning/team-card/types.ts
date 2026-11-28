import type { CampusEventPlanning } from "../../../api/client"
import type { PlanningTeam } from "../planning-schedule-board/types"

export type TeamCardProps = {
	event: CampusEventPlanning
	onSchedule: (roleName: string, replacementRequestId?: string) => void
	team: PlanningTeam
}
