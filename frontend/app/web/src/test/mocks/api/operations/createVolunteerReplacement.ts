/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import type { ApiOperationResponse } from "@porphyra/frontend/api/types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["createVolunteerReplacement"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	const original = mockDatabase.volunteerRequests[input.request_id]
	if (!eventTeam || !original || original.campusEventTeamId !== eventTeam.id)
		throw new Error("Volunteer request was not found for this team.")
	const eventMinistry = mockDatabase.campusEventMinistries[eventTeam.campusEventMinistryId]
	const event = eventMinistry && mockDatabase.campusEvents[eventMinistry.campusEventId]
	const viewer = getMockViewer()
	if (
		!event ||
		!Object.values(mockDatabase.churchMemberships).some(
			(membership) => membership.userId === viewer.id && membership.churchId === event.churchId,
		)
	)
		throw new Error("You are not a member of this event's church.")
	if (original.status !== "rejected")
		throw new Error("Only rejected volunteer requests can be replaced.")
	if (original.roleName !== (input.roleName ?? null))
		throw new Error("Replacement requests must use the same role.")
	if (
		Object.values(mockDatabase.volunteerRequests).some(
			(request) => request.replacingId === original.id,
		)
	)
		throw new Error("This volunteer request already has a replacement.")
	const membership = mockDatabase.teamMemberships[input.teamMembershipId]
	if (!membership || membership.teamId !== eventTeam.teamId)
		throw new Error("The selected volunteer is not a member of this team.")
	if (
		Object.values(mockDatabase.campusEventTeamVolunteers).some(
			(volunteer) =>
				volunteer.campusEventTeamId === eventTeam.id &&
				volunteer.teamMembershipId === membership.id,
		) ||
		Object.values(mockDatabase.volunteerRequests).some(
			(request) =>
				request.campusEventTeamId === eventTeam.id &&
				request.teamMembershipId === membership.id &&
				request.status === "pending",
		)
	)
		throw new Error("This volunteer already has an active request or assignment for this team.")
	const request = {
		id: `volunteer-request:${crypto.randomUUID()}`,
		campusEventTeamId: eventTeam.id,
		teamMembershipId: membership.id,
		roleName: original.roleName,
		roleEmoji: original.roleEmoji,
		status: "pending" as const,
		replacingId: original.id,
	}
	mockDatabase.volunteerRequests[request.id] = request
	return request satisfies ApiOperationResponse<"createVolunteerReplacement">
}
