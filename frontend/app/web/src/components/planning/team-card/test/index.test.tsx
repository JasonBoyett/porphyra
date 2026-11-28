import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CampusEventPlanning, CampusEventPlanningTeam } from "@/api/client"
import { LocalizationScope, TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { TeamCard } from ".."

const campusLocation = {
	addressLine1: "120 2nd Avenue North",
	addressLine2: null,
	city: "Nashville",
	region: "TN",
	postalCode: "37201",
	countryCode: "US",
	timeZone: "America/Chicago",
}

type TeamData = CampusEventPlanning["ministries"][number]["teams"][number]
const withActions = (team: TeamData): CampusEventPlanningTeam => {
	const unavailable = () => Promise.reject(new Error("Action unavailable in static rendering"))
	return Object.assign(team, {
		assignVolunteer: unavailable,
		changeVolunteerRole: unavailable,
		createVolunteerReplacement: unavailable,
		dropVolunteer: unavailable,
		updateRoleRequirements: unavailable,
	})
}

describe("planning team roles", () => {
	it("renders assignment counts from the API's nested role fields", () => {
		const team = withActions({
			id: "scheduled-team",
			teamId: "team",
			name: "Band",
			callTime: null,
			notes: [],
			confirmedAt: null,
			isFullyStaffed: false,
			roles: {
				Guitar: {
					acceptedCount: 2,
					count: 3,
					emoji: null,
					pendingCount: 0,
					scheduledUsers: ["volunteer-a", "volunteer-b"],
				},
			},
			volunteers: [],
			eligibleVolunteers: [],
		})
		const event: CampusEventPlanning = {
			id: "event",
			churchId: "church",
			churchName: "Church",
			campusId: "campus",
			campusName: "Campus",
			campusLocation,
			title: "Service",
			description: "",
			startsAt: "2026-11-15T10:00:00Z",
			endsAt: null,
			isStaffed: false,
			isFullyStaffed: false,
			teamsNeedingConfirmation: [],
			ministries: [{ id: "ministry", name: "Music", teams: [team] }],
		}

		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={porphyraCatalog}>
				<LocalizationScope name="planning.team-rosters">
					<TeamCard event={event} onSchedule={() => {}} team={team} />
				</LocalizationScope>
			</TranslationProvider>,
		)
		expect(markup).toContain("2 / 3")
		expect(markup).toContain("0 volunteers")
	})

	it("uses an open role as the scheduling control", () => {
		const team = withActions({
			id: "scheduled-team",
			teamId: "team",
			name: "Band",
			callTime: null,
			notes: [],
			confirmedAt: null,
			isFullyStaffed: false,
			roles: {
				Keys: {
					acceptedCount: 0,
					count: 1,
					emoji: "🎹",
					pendingCount: 0,
					scheduledUsers: [],
				},
				Leader: {
					acceptedCount: 1,
					count: 1,
					emoji: "🎤",
					pendingCount: 0,
					scheduledUsers: ["volunteer-a"],
				},
			},
			volunteers: [],
			eligibleVolunteers: [],
		})
		const event = {
			id: "event",
			churchId: "church",
			churchName: "Church",
			campusId: "campus",
			campusName: "Campus",
			campusLocation,
			title: "Service",
			description: "",
			startsAt: "2026-11-15T10:00:00Z",
			endsAt: null,
			isStaffed: false,
			isFullyStaffed: false,
			teamsNeedingConfirmation: [],
			ministries: [{ id: "ministry", name: "Music", teams: [team] }],
		} satisfies CampusEventPlanning

		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={porphyraCatalog}>
				<LocalizationScope name="planning.team-rosters">
					<TeamCard event={event} onSchedule={() => {}} team={team} />
				</LocalizationScope>
			</TranslationProvider>,
		)

		expect(markup).toContain('aria-label="Schedule a volunteer for Keys"')
		expect(markup).toContain('aria-label="Leader: 1 accepted and 0 pending of 1"')
		expect(markup).not.toContain("Schedule volunteer")
	})
})
