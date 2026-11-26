import { afterEach, describe, expect, test } from "vitest"

import {
	findMockCampus,
	findMockChurchByName,
	getMockViewer,
	mockDatabase,
	resetMockDatabase,
	setMockViewer,
} from ".."

afterEach(resetMockDatabase)

describe("mock database", () => {
	test("normalizes the backend seed into relational records", () => {
		const church = findMockChurchByName("Grace Harbor Church")
		expect(church).toMatchObject({ name: "Grace Harbor Church" })
		expect(findMockCampus(church!.id, "Downtown")).toMatchObject({
			churchId: church!.id,
			location: { city: "Nashville" },
		})
		expect(Object.values(mockDatabase.campusEvents)).toContainEqual(
			expect.objectContaining({ title: "Sunday Worship Service" }),
		)
	})

	test("resets a structured-clone baseline without replacing the public database object", () => {
		const reference = mockDatabase
		mockDatabase.churches["test:church"] = {
			id: "test:church",
			name: "Test Church",
			description: "Temporary",
		}
		getMockViewer().name = "Changed viewer"

		resetMockDatabase()

		expect(mockDatabase).toBe(reference)
		expect(mockDatabase.churches["test:church"]).toBeUndefined()
		expect(getMockViewer().name).toBe("A2:44 Tech")
	})

	test("defaults to the Porphyra development user", () => {
		expect(getMockViewer()).toMatchObject({
			authId: "development:dev@a244.tech",
			email: "dev@a244.tech",
		})
	})

	test("switches viewers by seeded email and stable mock id", () => {
		const volunteer = Object.values(mockDatabase.users).find(
			(user) => user.email === "chloe-davis@grace-harbor-church.test",
		)!
		expect(setMockViewer(volunteer.email)).toEqual(volunteer)
		expect(getMockViewer()).toEqual(volunteer)
		setMockViewer(volunteer.id)
		expect(getMockViewer().id).toBe(volunteer.id)
	})
})
