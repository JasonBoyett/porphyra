import type { TeamRole } from "../../../api/client"

export type RosterVolunteerProps = {
	accessToken?: string
	avatarUrl: string
	email: string
	eventTeamId?: string
	name: string
	roleEmoji: string | null
	roleName: string | null
	roles?: Record<string, TeamRole>
	status: "accepted" | "pending"
	volunteerId?: string
}
