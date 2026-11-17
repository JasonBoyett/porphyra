import type { CampusEventPlanning } from "../../../api/client"
import type { PlanningTeam } from "../planning-schedule-board/types"

export type SchedulingDialogProps = {
	accessToken: string
	event: CampusEventPlanning
	ministry: string | undefined
	onClose: () => void
	replacementRequestId?: string
	roleName: string | null
	team: PlanningTeam | undefined
}
