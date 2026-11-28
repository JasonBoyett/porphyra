import type { TeamRole } from "../../../api/client"

export type RosterVolunteerProps = {
	avatarUrl: string
	email: string
	name: string
	onChangeRole?: (roleName: string, roleEmoji: string | null) => Promise<unknown>
	onDrop?: () => Promise<unknown>
	roleEmoji: string | null
	roleName: string | null
	roles?: Record<string, TeamRole>
	status: "accepted" | "pending"
}
