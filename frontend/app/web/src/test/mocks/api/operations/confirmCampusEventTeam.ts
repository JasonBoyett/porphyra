/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockDatabase } from "../database"
import { requireChurchAccess, scheduledTeamResponse } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["confirmCampusEventTeam"] = async (input) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	if (!eventTeam) throw new Error("Mock event team was not found.")
	const event =
		mockDatabase.campusEvents[
			mockDatabase.campusEventMinistries[eventTeam.campusEventMinistryId].campusEventId
		]
	requireChurchAccess(event.churchId)
	const membership = mockDatabase.teamMemberships[input.teamMembershipId]
	if (
		!membership ||
		membership.teamId !== eventTeam.teamId ||
		mockDatabase.churchMemberships[membership.churchMembershipId].churchId !== event.churchId
	)
		throw new Error("Mock confirmation membership is invalid.")
	const mutableTeam = eventTeam as typeof eventTeam & {
		confirmedAt?: string | null
		confirmedByTeamMembershipId?: string | null
	}
	mutableTeam.confirmedAt = new Date().toISOString()
	mutableTeam.confirmedByTeamMembershipId = membership.id
	return scheduledTeamResponse(mutableTeam)
}
