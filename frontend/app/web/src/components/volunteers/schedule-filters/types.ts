import type { Campus } from "../types"

export type ScheduleFiltersProps = {
	campuses: readonly Campus[]
	campusId: string
	ministries: readonly string[]
	ministry: string
	onCampusChange: (campusId: string) => void
	onMinistryChange: (ministry: string) => void
}
