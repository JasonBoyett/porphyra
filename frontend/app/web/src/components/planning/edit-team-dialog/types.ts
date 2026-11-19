import type { CampusEventPlanning } from "@/api/client"
import type { PlanningTeam } from "../planning-schedule-board/types"

export type EditTeamDialogProps = {
	event: CampusEventPlanning
	onOpenChange: (open: boolean) => void
	open: boolean
	team: PlanningTeam
}
