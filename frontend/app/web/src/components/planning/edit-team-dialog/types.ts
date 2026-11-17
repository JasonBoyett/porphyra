import type { PlanningTeam } from "../planning-schedule-board/types"

export type EditTeamDialogProps = {
	onOpenChange: (open: boolean) => void
	open: boolean
	team: PlanningTeam
}
