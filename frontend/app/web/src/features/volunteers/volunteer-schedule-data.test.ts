import { describe, expect, it } from "vitest"

import type { MyVolunteerAssignmentResponse } from "@porphyra/frontend/api/types"

import { toVolunteerScheduleData } from "./volunteer-schedule-data"

const assignment = {
	id: "assignment",
	campusEventTeamId: "event-team",
	campusId: "campus",
	campusName: "Downtown",
	campusLocation: {
		addressLine1: "120 2nd Avenue North",
		addressLine2: null,
		city: "Nashville",
		region: "TN",
		postalCode: "37201",
		countryCode: "US",
		timeZone: "America/Chicago",
	},
	eventId: "event",
	eventTitle: "Sunday Worship",
	eventStartsAt: "2026-11-15T16:00:00Z",
	ministryId: "ministry",
	ministryName: "Music",
	teamId: "team",
	teamName: "Band",
	roleName: "Keys",
	roleEmoji: "🎹",
	callTime: "2026-11-15T15:30:00Z",
	notes: [],
} satisfies MyVolunteerAssignmentResponse

describe("toVolunteerScheduleData", () => {
	it("uses the campus timezone and builds a maps destination from its address", () => {
		const schedule = toVolunteerScheduleData([assignment])

		expect(schedule.assignments[0]).toMatchObject({
			callTime: "9:30 AM",
			eventStartTime: "10:00 AM",
			location: "Downtown",
			mapUrl:
				"https://www.google.com/maps/search/?api=1&query=120%202nd%20Avenue%20North%2C%20Nashville%2C%20TN%2037201%2C%20US",
		})
	})
})
