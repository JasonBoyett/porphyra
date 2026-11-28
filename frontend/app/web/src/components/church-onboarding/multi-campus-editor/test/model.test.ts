import { describe, expect, it } from "vitest"

import { addCampus, createCampus, removeCampus, updateCampus } from "../model"
import type { MultiCampusEditorValue } from "../types"

const value: MultiCampusEditorValue = {
	primaryCampusIndex: 2,
	campuses: [
		{ name: "North", campusType: "physical", timeZone: "America/Chicago" },
		{ name: "Online", campusType: "online", timeZone: "America/Chicago" },
		{ name: "South", campusType: "physical", timeZone: "America/New_York" },
	],
}

describe("multi-campus editor model", () => {
	it("creates physical campuses with the supplied time zone and Sunday service", () => {
		expect(createCampus("Europe/London")).toEqual({
			name: "",
			campusType: "physical",
			timeZone: "Europe/London",
			address: null,
			recurringServices: [
				{ name: "Sunday Service", weekday: 6, startsAt: "10:00", durationMinutes: 60 },
			],
		})
	})

	it("preserves entered campuses when adding and editing", () => {
		const added = addCampus(value, "Asia/Tokyo")
		const edited = updateCampus(added, 1, (campus) => ({ ...campus, name: "Church Online" }))

		expect(edited.campuses[0]).toBe(value.campuses[0])
		expect(edited.campuses[1]?.name).toBe("Church Online")
		expect(edited.campuses[3]?.timeZone).toBe("Asia/Tokyo")
	})

	it("adjusts primary selection when campuses are removed", () => {
		expect(removeCampus(value, 0).primaryCampusIndex).toBe(1)
		expect(removeCampus(value, 2).primaryCampusIndex).toBeNull()
	})
})
