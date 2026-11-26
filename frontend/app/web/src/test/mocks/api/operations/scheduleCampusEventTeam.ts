/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockDatabase } from "../database"
import { requireChurchAccess, scheduledTeamResponse } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["scheduleCampusEventTeam"] = async (input) => {
	const eventMinistry = mockDatabase.campusEventMinistries[input.event_ministry_id]
	if (!eventMinistry) throw new Error("Mock event ministry was not found.")
	const event = mockDatabase.campusEvents[eventMinistry.campusEventId]
	requireChurchAccess(event.churchId)
	const team = mockDatabase.teams[input.teamId]
	if (!team || team.ministryId !== eventMinistry.ministryId)
		throw new Error("Mock team does not belong to the ministry.")
	if (
		Object.values(mockDatabase.campusEventTeams).some(
			(item) => item.campusEventMinistryId === eventMinistry.id && item.teamId === team.id,
		)
	)
		throw new Error("Mock team is already scheduled.")
	const id = `campus-event-team:${crypto.randomUUID()}`
	mockDatabase.campusEventTeams[id] = {
		id,
		campusEventMinistryId: eventMinistry.id,
		teamId: team.id,
		callTime: input.callTime ?? null,
		notes: input.notes ?? [],
		roleRequirements: {},
	}
	return scheduledTeamResponse(mockDatabase.campusEventTeams[id])
}
