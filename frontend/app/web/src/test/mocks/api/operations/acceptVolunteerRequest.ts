/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import type { ApiOperationResponse } from "@porphyra/frontend/api/types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["acceptVolunteerRequest"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	const request = mockDatabase.volunteerRequests[input.request_id]
	if (
		!eventTeam ||
		!request ||
		request.campusEventTeamId !== eventTeam.id ||
		request.status !== "pending"
	)
		throw new Error("This volunteer request is not pending for this team.")
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
	if (
		Object.values(mockDatabase.volunteerRequests).some(
			(candidate) => candidate.replacingId === request.id,
		)
	)
		throw new Error("This volunteer request has been replaced.")
	if (
		Object.values(mockDatabase.campusEventTeamVolunteers).some(
			(volunteer) =>
				volunteer.campusEventTeamId === eventTeam.id &&
				volunteer.teamMembershipId === request.teamMembershipId,
		)
	)
		throw new Error("This volunteer is already assigned to this team.")
	const assignment = {
		id: `campus-event-team-volunteer:${crypto.randomUUID()}`,
		campusEventTeamId: eventTeam.id,
		teamMembershipId: request.teamMembershipId,
		roleName: request.roleName,
		roleEmoji: request.roleEmoji,
	}
	mockDatabase.campusEventTeamVolunteers[assignment.id] = assignment
	request.status = "resolved"
	for (const candidate of Object.values(mockDatabase.volunteerRequests))
		if (
			candidate.id !== request.id &&
			candidate.campusEventTeamId === eventTeam.id &&
			candidate.roleName === request.roleName &&
			candidate.status === "pending"
		)
			candidate.status = "resolved"
	return {
		...assignment,
		conflictConfirmedAt: null,
	} satisfies ApiOperationResponse<"acceptVolunteerRequest">
}
