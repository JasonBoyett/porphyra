/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockDatabase } from "../database"
import { requireChurchAccess, scheduledTeamResponse } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["updateCampusEventTeamRoleRequirements"] = async (
	input,
) => {
	const eventTeam = mockDatabase.campusEventTeams[input.event_team_id]
	if (!eventTeam) throw new Error("Mock event team was not found.")
	const event =
		mockDatabase.campusEvents[
			mockDatabase.campusEventMinistries[eventTeam.campusEventMinistryId].campusEventId
		]
	requireChurchAccess(event.churchId)
	const assignments = Object.values(mockDatabase.campusEventTeamVolunteers).filter(
		(item) => item.campusEventTeamId === eventTeam.id,
	)
	const changedCallTime = input.callTime !== undefined && input.callTime !== eventTeam.callTime
	const actions = new Map(
		(input.affectedVolunteers ?? []).map((action) => [action.assignmentId, action]),
	)
	const affected = assignments.filter(
		(assignment) =>
			changedCallTime ||
			(assignment.roleName !== null && input.roles[assignment.roleName] === undefined),
	)
	if (affected.some((assignment) => !actions.has(assignment.id)))
		throw new Error("Mock role update requires an action for every affected volunteer.")
	for (const assignment of affected) {
		const action = actions.get(assignment.id)!
		if (action.action === "reassign" && action.roleName && input.roles[action.roleName]) {
			const role = input.roles[action.roleName]
			const id = `volunteer-request:${crypto.randomUUID()}`
			mockDatabase.volunteerRequests[id] = {
				id,
				campusEventTeamId: eventTeam.id,
				teamMembershipId: assignment.teamMembershipId,
				roleName: action.roleName,
				roleEmoji: role.emoji ?? "",
				status: "pending",
				replacingId: null,
			}
		}
		delete mockDatabase.campusEventTeamVolunteers[assignment.id]
	}
	for (const request of Object.values(mockDatabase.volunteerRequests))
		if (
			request.campusEventTeamId === eventTeam.id &&
			request.status === "pending" &&
			!input.roles[request.roleName]
		)
			request.status = "resolved"
	eventTeam.roleRequirements = Object.fromEntries(
		Object.entries(input.roles).map(([name, role]) => [
			name,
			{ emoji: role.emoji ?? "", count: role.count },
		]),
	)
	if (input.callTime !== undefined) eventTeam.callTime = input.callTime
	if (changedCallTime) {
		;(eventTeam as typeof eventTeam & { confirmedAt?: string | null }).confirmedAt = null
	}
	return scheduledTeamResponse(eventTeam)
}
