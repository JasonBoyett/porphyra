import type { PlannedVolunteer } from "../../../api/client"

export type RoleEditorProps = {
	accessToken: string
	eventTeamId: string
	volunteer: PlannedVolunteer
}
