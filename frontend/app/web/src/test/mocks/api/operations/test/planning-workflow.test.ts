import { afterEach, describe, expect, test } from "vitest"

import { mockDatabase, resetMockDatabase } from "../../database"
import { mockOperation as confirmCampusEventTeam } from "../confirmCampusEventTeam"
import { mockOperation as createCampusEvent } from "../createCampusEvent"
import { mockOperation as getCampusEventPlanning } from "../getCampusEventPlanning"
import { mockOperation as getCampusEvents } from "../getCampusEvents"
import { mockOperation as getCampusEventTeamVolunteerRequests } from "../getCampusEventTeamVolunteerRequests"
import { mockOperation as scheduleCampusEventMinistry } from "../scheduleCampusEventMinistry"
import { mockOperation as scheduleCampusEventTeam } from "../scheduleCampusEventTeam"
import { mockOperation as updateCampusEventTeamRoleRequirements } from "../updateCampusEventTeamRoleRequirements"

afterEach(resetMockDatabase)

describe("planning operation mocks", () => {
	test("returns request roster details from shared state", async () => {
		const request = Object.values(mockDatabase.volunteerRequests)[0]
		expect(request).toBeDefined()
		const roster = await getCampusEventTeamVolunteerRequests({
			event_team_id: request.campusEventTeamId,
		})
		expect(roster).toContainEqual(
			expect.objectContaining({
				id: request.id,
				campusEventTeamId: request.campusEventTeamId,
				roleName: request.roleName,
			}),
		)
	})

	test("persists a new event, ministry, team, requirements, and confirmation", async () => {
		const church = Object.values(mockDatabase.churches)[0]
		const campus = Object.values(mockDatabase.campuses).find((item) => item.churchId === church.id)!
		const ministry = Object.values(mockDatabase.ministries).find(
			(item) => item.churchId === church.id,
		)!
		const team = Object.values(mockDatabase.teams).find((item) => item.ministryId === ministry.id)!

		const event = await createCampusEvent({
			churchId: church.id,
			campusId: campus.id,
			title: "Mock planning event",
			description: "",
			startsAt: "2030-01-01T10:00:00Z",
			endsAt: null,
		})
		expect((await getCampusEvents()).map((item) => item.id)).toContain(event.id)

		const scheduledMinistry = await scheduleCampusEventMinistry({
			event_id: event.id,
			ministryId: ministry.id,
		})
		const scheduledTeam = await scheduleCampusEventTeam({
			event_ministry_id: scheduledMinistry.id,
			teamId: team.id,
			notes: ["Bring radios"],
		})
		await updateCampusEventTeamRoleRequirements({
			event_team_id: scheduledTeam.id,
			roles: { Greeter: { emoji: "👋", count: 2 } },
		})
		const membership = Object.values(mockDatabase.teamMemberships).find(
			(item) => item.teamId === team.id,
		)!
		await confirmCampusEventTeam({
			event_team_id: scheduledTeam.id,
			teamMembershipId: membership.id,
		})

		const planning = await getCampusEventPlanning({ event_id: event.id })
		expect(planning.ministries[0].teams[0]).toMatchObject({
			id: scheduledTeam.id,
			notes: ["Bring radios"],
			confirmedAt: expect.any(String),
			roles: { Greeter: { emoji: "👋", count: 2 } },
		})
	})
})
