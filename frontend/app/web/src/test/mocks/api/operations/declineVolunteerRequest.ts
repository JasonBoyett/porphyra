/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["declineVolunteerRequest"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	const request = mockDatabase.volunteerRequests[input.request_id]
	if (
		!eventTeam ||
		!request ||
		request.campusEventTeamId !== eventTeam.id ||
		request.status !== "pending"
	)
		throw new Error("This volunteer request is not pending for this team.")
	const membership = mockDatabase.teamMemberships[request.teamMembershipId]
	if (
		!membership ||
		mockDatabase.churchMemberships[membership.churchMembershipId]?.userId !== getMockViewer().id
	)
		throw new Error("Only the requested volunteer can decline this request.")
	request.status = "rejected"
	return {
		id: request.id,
		campusEventTeamId: request.campusEventTeamId,
		teamMembershipId: request.teamMembershipId,
		roleName: request.roleName,
		roleEmoji: request.roleEmoji,
		status: request.status,
		replacingId: request.replacingId,
	}
}
