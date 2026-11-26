import { beforeEach, describe, expect, test } from "vitest"
import type { ApiOperationInput } from "@porphyra/frontend/api/types"

import { getMockViewer, mockDatabase, resetMockDatabase, setMockViewer } from "../../database"
import { mockOperation as acceptVolunteerRequest } from "../acceptVolunteerRequest"
import { mockOperation as assignCampusEventVolunteer } from "../assignCampusEventVolunteer"
import { mockOperation as cancelMyVolunteerAssignment } from "../cancelMyVolunteerAssignment"
import { mockOperation as changeCampusEventVolunteerRole } from "../changeCampusEventVolunteerRole"
import { mockOperation as createVolunteerReplacement } from "../createVolunteerReplacement"
import { mockOperation as declineVolunteerRequest } from "../declineVolunteerRequest"
import { mockOperation as dropCampusEventVolunteer } from "../dropCampusEventVolunteer"
import { mockOperation as getMyVolunteerAssignments } from "../getMyVolunteerAssignments"
import { mockOperation as getMyVolunteerRequests } from "../getMyVolunteerRequests"

const getBandTeam = () =>
	Object.values(mockDatabase.campusEventTeams).find(
		(team) => mockDatabase.teams[team.teamId]?.name === "Band",
	)

const getAvailableMembership = (eventTeamId: string, teamId: string) =>
	Object.values(mockDatabase.teamMemberships).find(
		(membership) =>
			membership.teamId === teamId &&
			!Object.values(mockDatabase.volunteerRequests).some(
				(request) =>
					request.campusEventTeamId === eventTeamId && request.teamMembershipId === membership.id,
			) &&
			!Object.values(mockDatabase.campusEventTeamVolunteers).some(
				(assignment) =>
					assignment.campusEventTeamId === eventTeamId &&
					assignment.teamMembershipId === membership.id,
			),
	)

const getMembershipUser = (membershipId: string) => {
	const membership = mockDatabase.teamMemberships[membershipId]
	return mockDatabase.users[mockDatabase.churchMemberships[membership.churchMembershipId].userId]
}

describe("volunteer workflow mock operations", () => {
	beforeEach(resetMockDatabase)

	test("creates, accepts, changes, and removes an assignment reflected by my assignments", async () => {
		const eventTeam = getBandTeam()
		expect(eventTeam).toBeDefined()
		const membership = getAvailableMembership(eventTeam!.id, eventTeam!.teamId)
		expect(membership).toBeDefined()

		const assignInput = {
			event_team_id: eventTeam!.id,
			teamMembershipId: membership!.id,
			confirmConflict: false,
			roleName: "Worship leader",
			roleEmoji: null,
		} satisfies ApiOperationInput<"assignCampusEventVolunteer">
		const request = await assignCampusEventVolunteer(assignInput)
		setMockViewer(getMembershipUser(membership!.id).id)
		expect(await getMyVolunteerRequests({})).toEqual([
			expect.objectContaining({ id: request.id, status: "pending" }),
		])

		setMockViewer("dev@a244.tech")
		const assignment = await acceptVolunteerRequest({
			event_team_id: eventTeam!.id,
			request_id: request.id,
		} satisfies ApiOperationInput<"acceptVolunteerRequest">)
		await changeCampusEventVolunteerRole({
			event_team_id: eventTeam!.id,
			volunteer_id: assignment.id,
			roleName: "Guitar",
			roleEmoji: null,
		} satisfies ApiOperationInput<"changeCampusEventVolunteerRole">)

		setMockViewer(getMembershipUser(membership!.id).id)
		expect((await getMyVolunteerAssignments()).assignments).toEqual([
			expect.objectContaining({ id: assignment.id, roleName: "Guitar" }),
		])
		await cancelMyVolunteerAssignment({
			event_team_id: eventTeam!.id,
			volunteer_id: assignment.id,
		} satisfies ApiOperationInput<"cancelMyVolunteerAssignment">)
		expect((await getMyVolunteerAssignments()).assignments).toEqual([])
	})

	test("allows only the requested volunteer to decline and replaces rejected requests", async () => {
		const eventTeam = getBandTeam()!
		const request = Object.values(mockDatabase.volunteerRequests).find(
			(candidate) => candidate.campusEventTeamId === eventTeam.id && candidate.status === "pending",
		)!
		await expect(
			declineVolunteerRequest({
				event_team_id: eventTeam.id,
				request_id: request.id,
			} satisfies ApiOperationInput<"declineVolunteerRequest">),
		).rejects.toThrow("Only the requested volunteer")

		const membership = mockDatabase.teamMemberships[request.teamMembershipId]
		setMockViewer(
			mockDatabase.users[mockDatabase.churchMemberships[membership.churchMembershipId].userId].id,
		)
		await declineVolunteerRequest({
			event_team_id: eventTeam.id,
			request_id: request.id,
		} satisfies ApiOperationInput<"declineVolunteerRequest">)
		expect(mockDatabase.volunteerRequests[request.id].status).toBe("rejected")

		setMockViewer("dev@a244.tech")
		const replacementMembership = getAvailableMembership(eventTeam.id, eventTeam.teamId)!
		const replacement = await createVolunteerReplacement({
			event_team_id: eventTeam.id,
			request_id: request.id,
			teamMembershipId: replacementMembership.id,
			confirmConflict: false,
			roleName: request.roleName,
			roleEmoji: request.roleEmoji,
		} satisfies ApiOperationInput<"createVolunteerReplacement">)
		expect(replacement.replacingId).toBe(request.id)
	})

	test("does not let a volunteer drop another volunteer's assignment", async () => {
		const eventTeam = getBandTeam()!
		const membership = getAvailableMembership(eventTeam.id, eventTeam.teamId)!
		const assignment = {
			id: "assignment:test",
			campusEventTeamId: eventTeam.id,
			teamMembershipId: membership.id,
			roleName: null,
			roleEmoji: null,
		}
		mockDatabase.campusEventTeamVolunteers[assignment.id] = assignment
		setMockViewer("dev@a244.tech")
		await dropCampusEventVolunteer({
			event_team_id: eventTeam.id,
			volunteer_id: assignment.id,
		} satisfies ApiOperationInput<"dropCampusEventVolunteer">)
		expect(mockDatabase.campusEventTeamVolunteers[assignment.id]).toBeUndefined()
		expect(getMockViewer().email).toBe("dev@a244.tech")
	})
})
