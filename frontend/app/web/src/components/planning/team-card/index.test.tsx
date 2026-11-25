import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CampusEventPlanning } from "@/api/client"
import { LocalizationScope, TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { TeamCard } from "."

const campusLocation = {
	addressLine1: "120 2nd Avenue North",
	addressLine2: null,
	city: "Nashville",
	region: "TN",
	postalCode: "37201",
	countryCode: "US",
	timeZone: "America/Chicago",
}

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
					acceptedCount: 2,
					count: 3,
					emoji: null,
					pendingCount: 0,
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

			expect(
				renderToStaticMarkup(
					<TranslationProvider catalog={porphyraCatalog}>
						<LocalizationScope name="planning.team-rosters">
							<TeamCard accessToken="fixture" event={event} onSchedule={() => {}} team={team} />
						</LocalizationScope>
					</TranslationProvider>,
				),
		).toContain("2 / 3")
	})

	it("uses an open role as the scheduling control", () => {
		const team: CampusEventPlanning["ministries"][number]["teams"][number] = {
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
		}
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
					<TeamCard accessToken="fixture" event={event} onSchedule={() => {}} team={team} />
				</LocalizationScope>
			</TranslationProvider>,
		)

		expect(markup).toContain('aria-label="Schedule a volunteer for Keys"')
		expect(markup).toContain('aria-label="Leader: 1 accepted and 0 pending of 1"')
		expect(markup).not.toContain("Schedule volunteer")
	})
})
