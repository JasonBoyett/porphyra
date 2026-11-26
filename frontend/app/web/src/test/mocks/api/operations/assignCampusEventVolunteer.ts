/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import type { ApiOperationResponse } from "@porphyra/frontend/api/types"

import { getMockViewer, mockDatabase } from "../database"
import type { MockVolunteerRequest } from "../database"

export const mockOperation: ApiClientTransport["assignCampusEventVolunteer"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	if (!eventTeam) throw new Error(`Campus event team "${input.event_team_id}" was not found.`)
	const eventMinistry = mockDatabase.campusEventMinistries[eventTeam.campusEventMinistryId]
	const event = eventMinistry && mockDatabase.campusEvents[eventMinistry.campusEventId]
	const viewer = getMockViewer()
	if (
		!event ||
		!Object.values(mockDatabase.churchMemberships).some(
			(membership) => membership.userId === viewer.id && membership.churchId === event.churchId,
		)
	) {
		throw new Error("You are not a member of this event's church.")
	}
	const membership = mockDatabase.teamMemberships[input.teamMembershipId]
	if (!membership || membership.teamId !== eventTeam.teamId) {
		throw new Error("The selected volunteer is not a member of this team.")
	}
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
	) {
		throw new Error("This volunteer already has an active request or assignment for this team.")
	}
	const role = input.roleName ? eventTeam.roleRequirements[input.roleName] : undefined
	if (input.roleName && !role) throw new Error("The selected role is not configured for this team.")
	if (role) {
		const reserved =
			Object.values(mockDatabase.campusEventTeamVolunteers).filter(
				(volunteer) =>
					volunteer.campusEventTeamId === eventTeam.id && volunteer.roleName === input.roleName,
			).length +
			Object.values(mockDatabase.volunteerRequests).filter(
				(request) =>
					request.campusEventTeamId === eventTeam.id &&
					request.roleName === input.roleName &&
					request.status === "pending",
			).length
		if (reserved >= role.count) throw new Error("The selected role has no remaining openings.")
	}
	const request = {
		id: `volunteer-request:${crypto.randomUUID()}`,
		campusEventTeamId: eventTeam.id,
		teamMembershipId: membership.id,
		roleName: input.roleName ?? null,
		roleEmoji: role?.emoji ?? input.roleEmoji ?? null,
		status: "pending" as const,
		replacingId: null,
	}
	mockDatabase.volunteerRequests[request.id] = request as MockVolunteerRequest
	return request satisfies ApiOperationResponse<"assignCampusEventVolunteer">
}
