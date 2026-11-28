import type { CampusEventPlanning, CampusEventPlanningTeam } from "../../../api/client"

export type ScheduleFilter = "all" | "attention" | "confirmed" | "my-teams"

export type PlanningTeam = CampusEventPlanningTeam

export type TeamGroup = {
	name: string
	teams: Array<{
		ministry: string
		team: PlanningTeam
	}>
}

export type PlanningScheduleBoardProps = {
	event: CampusEventPlanning
	events: readonly { id: string; title: string }[]
	filter: ScheduleFilter
	ministry: string
	onFilterChange: (filter: ScheduleFilter) => void
	onMinistryChange: (ministry: string) => void
	onSchedule: (teamId: string, roleName: string, replacementRequestId?: string) => void
	onSelectedEventChange: (eventId: string) => void
	selectedEventId: string
	teamsByMinistry: TeamGroup[]
	visibleTeamCount: number
}
