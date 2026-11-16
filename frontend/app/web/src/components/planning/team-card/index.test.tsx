import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CampusEventPlanning } from "@/api/client"
import { TeamCard } from "."

describe("planning team roles", () => {
	it("renders assignment counts from the API's nested role fields", () => {
		const team: CampusEventPlanning["ministries"][number]["teams"][number] = {
			id: "scheduled-team",
			teamId: "team",
			name: "Band",
			callTime: null,
			notes: [],
			confirmedAt: null,
			isFullyStaffed: false,
			roles: {
				Guitar: {
					count: 3,
					emoji: null,
					scheduledUsers: ["volunteer-a", "volunteer-b"],
				},
			},
			volunteers: [],
			eligibleVolunteers: [],
		}
		const event: CampusEventPlanning = {
			id: "event",
			churchId: "church",
			churchName: "Church",
			campusId: "campus",
			campusName: "Campus",
			title: "Service",
			startsAt: "2026-11-15T10:00:00Z",
			endsAt: null,
			isStaffed: false,
			isFullyStaffed: false,
			teamsNeedingConfirmation: [],
			ministries: [{ id: "ministry", name: "Music", teams: [team] }],
		}

		expect(
			renderToStaticMarkup(
				<TeamCard accessToken="fixture" event={event} onSchedule={() => {}} team={team} />,
			),
		).toContain("2 / 3")
	})
})
