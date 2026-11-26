/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockDatabase } from "../database"
import { requireChurchAccess } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["getCampusEventTeamVolunteerRequests"] = async (
	input,
) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	if (!eventTeam) throw new Error("Mock event team was not found.")
	const event =
		mockDatabase.campusEvents[
			mockDatabase.campusEventMinistries[eventTeam.campusEventMinistryId].campusEventId
		]
	requireChurchAccess(event.churchId)
	return Object.values(mockDatabase.volunteerRequests)
		.filter(
			(request) =>
				request.campusEventTeamId === eventTeam.id &&
				(input.include_resolved || request.status !== "resolved"),
		)
		.map((request) => {
			const membership = mockDatabase.teamMemberships[request.teamMembershipId]
			const user =
				mockDatabase.users[mockDatabase.churchMemberships[membership.churchMembershipId].userId]
			return {
				id: request.id,
				campusEventTeamId: request.campusEventTeamId,
				teamMembershipId: request.teamMembershipId,
				roleName: request.roleName,
				roleEmoji: request.roleEmoji,
				status: request.status,
				replacingId: request.replacingId,
				userId: user.id,
				name: user.name,
				email: user.email,
				avatarUrl: "",
			}
		})
}
