/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import type { ApiOperationResponse } from "@porphyra/frontend/api/types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["dropCampusEventVolunteer"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	const assignment = mockDatabase.campusEventTeamVolunteers[input.volunteer_id]
	if (!eventTeam || !assignment || assignment.campusEventTeamId !== eventTeam.id)
		throw new Error("Volunteer assignment was not found for this team.")
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
	delete mockDatabase.campusEventTeamVolunteers[assignment.id]
	return {
		...assignment,
		conflictConfirmedAt: null,
	} satisfies ApiOperationResponse<"dropCampusEventVolunteer">
}
