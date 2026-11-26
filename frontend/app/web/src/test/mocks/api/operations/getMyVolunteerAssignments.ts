/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["getMyVolunteerAssignments"] = async () => {
	const viewer = getMockViewer()
	const assignments = Object.values(mockDatabase.campusEventTeamVolunteers)
		.filter((assignment) => {
			const membership = mockDatabase.teamMemberships[assignment.teamMembershipId]
			return mockDatabase.churchMemberships[membership?.churchMembershipId]?.userId === viewer.id
		})
		.map((assignment) => {
			const eventTeam = mockDatabase.campusEventTeams[assignment.campusEventTeamId]
			const eventMinistry =
				eventTeam && mockDatabase.campusEventMinistries[eventTeam.campusEventMinistryId]
			const event = eventMinistry && mockDatabase.campusEvents[eventMinistry.campusEventId]
			const campus = event && mockDatabase.campuses[event.campusId]
			const ministry = eventMinistry && mockDatabase.ministries[eventMinistry.ministryId]
			const team = eventTeam && mockDatabase.teams[eventTeam.teamId]
			if (!eventTeam || !event || !campus || !ministry || !team)
				throw new Error(`Volunteer assignment "${assignment.id}" has incomplete event data.`)
			return {
				id: assignment.id,
				campusEventTeamId: eventTeam.id,
				campusId: campus.id,
				campusName: campus.name,
				campusLocation: {
					...campus.location,
					addressLine2: campus.location.addressLine2 ?? null,
				},
				eventId: event.id,
				eventTitle: event.title,
				eventStartsAt: event.startsAt,
				ministryId: ministry.id,
				ministryName: ministry.name,
				teamId: team.id,
				teamName: team.name,
				roleName: assignment.roleName,
				roleEmoji: assignment.roleEmoji,
				callTime: eventTeam.callTime,
				notes: eventTeam.notes,
			}
		})
		.sort((left, right) => left.eventStartsAt.localeCompare(right.eventStartsAt))
	return { userId: viewer.id, assignments }
}
