/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import type { ApiOperationResponse } from "@porphyra/frontend/api/types"
import { getMockViewer, mockDatabase } from "../database"

type TeamWithConfirmation = (typeof mockDatabase.campusEventTeams)[string] & {
	confirmedAt?: string | null
	confirmedByTeamMembershipId?: string | null
}

export function requireChurchAccess(churchId: string): void {
	const viewer = getMockViewer()
	if (
		!Object.values(mockDatabase.churchMemberships).some(
			(membership) => membership.userId === viewer.id && membership.churchId === churchId,
		)
	)
		throw new Error("Mock resource was not found for the selected viewer.")
}

const campusLocation = (campus: (typeof mockDatabase.campuses)[string]) => ({
	...campus.location,
	addressLine2: campus.location.addressLine2 ?? null,
})

export function scheduledTeamResponse(
	eventTeam: TeamWithConfirmation,
): ApiOperationResponse<"scheduleCampusEventTeam"> {
	const assignments = Object.values(mockDatabase.campusEventTeamVolunteers).filter(
		(assignment) => assignment.campusEventTeamId === eventTeam.id,
	)
	const requests = Object.values(mockDatabase.volunteerRequests).filter(
		(request) => request.campusEventTeamId === eventTeam.id && request.status === "pending",
	)
	const roles = Object.fromEntries(
		Object.entries(eventTeam.roleRequirements).map(([name, role]) => [
			name,
			{
				emoji: role.emoji,
				count: role.count,
				scheduledUsers: assignments
					.filter((assignment) => assignment.roleName === name)
					.map((assignment) => {
						const membership = mockDatabase.teamMemberships[assignment.teamMembershipId]
						return mockDatabase.churchMemberships[membership.churchMembershipId].userId
					}),
				acceptedCount: assignments.filter((assignment) => assignment.roleName === name).length,
				pendingCount: requests.filter((request) => request.roleName === name).length,
			},
		]),
	)
	return {
		id: eventTeam.id,
		teamId: eventTeam.teamId,
		callTime: eventTeam.callTime,
		notes: [...eventTeam.notes],
		confirmedAt: eventTeam.confirmedAt ?? null,
		isFullyStaffed: Object.entries(eventTeam.roleRequirements).every(
			([name, role]) =>
				assignments.filter((assignment) => assignment.roleName === name).length >= role.count,
		),
		roles,
	}
}

export function planningResponse(eventId: string): ApiOperationResponse<"getCampusEventPlanning"> {
	const event = mockDatabase.campusEvents[eventId]
	if (!event) throw new Error("Mock campus event was not found.")
	requireChurchAccess(event.churchId)
	const church = mockDatabase.churches[event.churchId]
	const campus = mockDatabase.campuses[event.campusId]
	const ministries = Object.values(mockDatabase.campusEventMinistries).filter(
		(item) => item.campusEventId === event.id,
	)
	const plannedTeams = Object.values(mockDatabase.campusEventTeams)
	const teams = plannedTeams.filter((team) =>
		ministries.some((ministry) => ministry.id === team.campusEventMinistryId),
	)
	const isFullyStaffed = teams.every((team) => scheduledTeamResponse(team).isFullyStaffed)
	return {
		id: event.id,
		churchId: event.churchId,
		churchName: church.name,
		campusId: campus.id,
		campusName: campus.name,
		campusLocation: campusLocation(campus),
		title: event.title,
		description: event.description,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		isStaffed: teams.length > 0,
		isFullyStaffed,
		teamsNeedingConfirmation: teams.filter((team) => !team.confirmedAt).map((team) => team.id),
		ministries: ministries.map((ministry) => ({
			id: ministry.id,
			name: mockDatabase.ministries[ministry.ministryId].name,
			teams: plannedTeams
				.filter((team) => team.campusEventMinistryId === ministry.id)
				.map((team) => {
					const base = scheduledTeamResponse(team)
					const assignedMembershipIds = new Set(
						Object.values(mockDatabase.campusEventTeamVolunteers)
							.filter((a) => a.campusEventTeamId === team.id)
							.map((a) => a.teamMembershipId),
					)
					const pendingMembershipIds = new Set(
						Object.values(mockDatabase.volunteerRequests)
							.filter((r) => r.campusEventTeamId === team.id && r.status === "pending")
							.map((r) => r.teamMembershipId),
					)
					const roster = (
						membershipId: string,
						assignmentId: string,
						roleName: string | null,
						roleEmoji: string | null,
					) => {
						const membership = mockDatabase.teamMemberships[membershipId]
						const user =
							mockDatabase.users[
								mockDatabase.churchMemberships[membership.churchMembershipId].userId
							]
						return {
							assignmentId,
							teamMembershipId: membershipId,
							userId: user.id,
							name: user.name,
							email: user.email,
							avatarUrl: "",
							roleName,
							roleEmoji,
							conflictConfirmedAt: null,
						}
					}
					return {
						...base,
						name: mockDatabase.teams[team.teamId].name,
						volunteers: Object.values(mockDatabase.campusEventTeamVolunteers)
							.filter((a) => a.campusEventTeamId === team.id)
							.map((a) => roster(a.teamMembershipId, a.id, a.roleName, a.roleEmoji)),
						volunteerRequests: Object.values(mockDatabase.volunteerRequests)
							.filter((r) => r.campusEventTeamId === team.id && r.status !== "resolved")
							.map((r) => ({
								...roster(r.teamMembershipId, r.id, r.roleName, r.roleEmoji),
								id: r.id,
								campusEventTeamId: team.id,
								status: r.status,
								replacingId: r.replacingId,
							})),
						eligibleVolunteers: Object.values(mockDatabase.teamMemberships)
							.filter(
								(m) =>
									m.teamId === team.teamId &&
									!assignedMembershipIds.has(m.id) &&
									!pendingMembershipIds.has(m.id),
							)
							.map((m) => roster(m.id, m.id, null, null)),
					}
				}),
		})),
	}
}

export const mockOperation: ApiClientTransport["getCampusEventPlanning"] = async (input) =>
	planningResponse(input.event_id)
