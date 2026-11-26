import { afterEach, describe, expect, test } from "vitest"

import { mockDatabase, resetMockDatabase, setMockViewer } from "../../database"
import { mockOperation as getAllChurchMemberships } from "../getAllChurchMemberships"
import { mockOperation as getChurchMembership } from "../getChurchMembership"
import { mockOperation as getCurrentUser } from "../getCurrentUser"
import { mockOperation as getDashboard } from "../getDashboard"
import { mockOperation as health } from "../health_health_get"

afterEach(resetMockDatabase)

describe("core mock operations", () => {
	test("returns only the selected viewer's church memberships", async () => {
		const volunteer = Object.values(mockDatabase.users).find(
			(user) => user.email === "chloe-davis@grace-harbor-church.test",
		)!
		setMockViewer(volunteer.id)

		const memberships = await getAllChurchMemberships()

		expect(memberships).toEqual([
			expect.objectContaining({ user_id: volunteer.id, church_id: expect.any(String) }),
		])
	})

	test("returns a church membership only when it belongs to the selected viewer", async () => {
		const viewer = setMockViewer("dev@a244.tech")
		const churchId = "church:private"
		const membership = {
			id: "church-membership:private",
			userId: viewer.id,
			churchId,
		}
		mockDatabase.churchMemberships[membership.id] = membership

		await expect(getChurchMembership({ church_id: membership.churchId })).resolves.toEqual({
			id: membership.id,
			user_id: membership.userId,
			church_id: membership.churchId,
		})

		setMockViewer("chloe-davis@grace-harbor-church.test")
		await expect(getChurchMembership({ church_id: membership.churchId })).rejects.toThrow(
			"was not found",
		)
	})

	test("builds the dashboard from the selected viewer's visible church records", async () => {
		const dashboard = await getDashboard()

		expect(dashboard.viewer).toMatchObject({
			email: "dev@a244.tech",
			avatarUrl: expect.stringContaining("seed=development%3Adev%40a244.tech"),
		})
		expect(dashboard.churches[0]).toMatchObject({
			name: "Grace Harbor Church",
			campuses: expect.arrayContaining([expect.objectContaining({ name: "Downtown" })]),
			ministries: expect.arrayContaining([expect.objectContaining({ name: "Kids" })]),
		})
	})

	test("returns the selected user and health response in generated response shapes", async () => {
		setMockViewer("chloe-davis@grace-harbor-church.test")

		await expect(getCurrentUser()).resolves.toMatchObject({
			name: "Chloe Davis",
			email: "chloe-davis@grace-harbor-church.test",
			auth_id: expect.any(String),
		})
		await expect(health()).resolves.toEqual({
			status: "ok",
			service: "porphyra-api",
		})
	})
})
