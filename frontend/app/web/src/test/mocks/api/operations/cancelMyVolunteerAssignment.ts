/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import type { ApiOperationResponse } from "@porphyra/frontend/api/types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["cancelMyVolunteerAssignment"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	const assignment = mockDatabase.campusEventTeamVolunteers[input.volunteer_id]
	if (!eventTeam || !assignment || assignment.campusEventTeamId !== eventTeam.id)
		throw new Error("Your volunteer assignment was not found for this team.")
	const membership = mockDatabase.teamMemberships[assignment.teamMembershipId]
	if (
		!membership ||
		mockDatabase.churchMemberships[membership.churchMembershipId]?.userId !== getMockViewer().id
	)
		throw new Error("You can only cancel your own volunteer assignment.")
	delete mockDatabase.campusEventTeamVolunteers[assignment.id]
	for (const request of Object.values(mockDatabase.volunteerRequests))
		if (
			request.campusEventTeamId === eventTeam.id &&
			request.teamMembershipId === assignment.teamMembershipId &&
			request.roleName === assignment.roleName &&
			request.status === "resolved"
		)
			request.status = "rejected"
	return {
		...assignment,
		conflictConfirmedAt: null,
	} satisfies ApiOperationResponse<"cancelMyVolunteerAssignment">
}
