// @vitest-environment jsdom
import { act } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { asViewer, type RenderedApplication } from "@/test/helpers"
import { mockDatabase } from "@/test/mocks/api/database"

const waitFor = async (assertion: () => void) => {
	let lastError: unknown
	for (let attempt = 0; attempt < 50; attempt += 1) {
		try {
			assertion()
			return
		} catch (error) {
			lastError = error
			await new Promise((resolve) => setTimeout(resolve, 10))
		}
	}
	throw lastError
}

const requestViewerEmail = () => {
	const request = Object.values(mockDatabase.volunteerRequests).find(
		(candidate) => candidate.status === "pending",
	)
	if (request === undefined) throw new Error("Expected a seeded pending volunteer request.")
	const membership = mockDatabase.teamMemberships[request.teamMembershipId]
	return mockDatabase.users[mockDatabase.churchMemberships[membership.churchMembershipId].userId]
		.email
}

describe("VolunteerSchedule", () => {
	let rendered: RenderedApplication | undefined
	let originalPath = ""

	afterEach(async () => {
		if (rendered !== undefined) await rendered.unmount()
		rendered = undefined
		if (originalPath !== "") window.history.replaceState({}, "", originalPath)
	})

	it("shows viewer-specific requests, accepts one, and refreshes the viewer's assignments", async () => {
		originalPath = `${window.location.pathname}${window.location.search}`
		window.history.replaceState({}, "", "/app/volunteers")
		rendered = await asViewer(requestViewerEmail())

		await waitFor(() => {
			expect(rendered?.container.textContent).toContain("Upcoming schedule")
			expect(rendered?.container.textContent).toContain("Nothing scheduled here")
		})

		const requestsTab = [
			...rendered.container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
		].find((tab) => tab.textContent?.includes("Requests"))
		expect(requestsTab).toBeDefined()
		await act(async () => {
			requestsTab?.focus()
			requestsTab?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }))
		})

		await waitFor(() => {
			expect(rendered?.container.textContent).toContain("Response needed")
			expect(rendered?.container.textContent).toContain("Accept")
		})

		const accept = [...rendered.container.querySelectorAll<HTMLButtonElement>("button")].find(
			(button) => button.textContent?.trim() === "Accepted",
		)
		expect(accept).toBeDefined()
		await act(async () => accept?.click())

		await waitFor(() => {
			expect(rendered?.container.textContent).toContain("You have no requests waiting")
		})

		const scheduleTab = [
			...rendered.container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
		].find((tab) => tab.textContent?.includes("My schedule"))
		await act(async () => {
			scheduleTab?.focus()
			scheduleTab?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }))
			await rendered?.queryClient.refetchQueries({
				queryKey: rendered.apiClient.getMyVolunteerAssignments.queryKey(),
			})
		})

		await waitFor(() => {
			expect(rendered?.container.textContent).toContain("Keys")
			expect(rendered?.container.textContent).toContain("Sunday Worship Service")
		})
	})
})
