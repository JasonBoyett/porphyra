// @vitest-environment jsdom

import { act } from "react"
import { afterEach, describe, expect, it } from "vitest"

import { apiClient } from "@/api/client"
import { renderApplication, type RenderedApplication } from "@/test/helpers"
import { mockDatabase } from "@/test/mocks/api/database"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

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

const replaceGlobalClientWith = (client: RenderedApplication["apiClient"]) => {
	const originalOperations = Object.fromEntries(
		Object.keys(apiClient).map((key) => [key, apiClient[key as keyof typeof apiClient]]),
	)
	Object.assign(apiClient, client)
	return () => Object.assign(apiClient, originalOperations)
}

describe("PlanningScheduleBoard", () => {
	let rendered: RenderedApplication | undefined
	let restoreApiClient: (() => void) | undefined
	let originalPath = ""

	afterEach(async () => {
		restoreApiClient?.()
		restoreApiClient = undefined
		if (rendered !== undefined) await rendered.unmount()
		rendered = undefined
		if (originalPath !== "") window.history.replaceState({}, "", originalPath)
	})

	it("renders planning data and refreshes the board after scheduling a volunteer", async () => {
		originalPath = `${window.location.pathname}${window.location.search}`
		window.history.replaceState({}, "", "/app")
		rendered = await renderApplication()
		restoreApiClient = replaceGlobalClientWith(rendered.apiClient)

		await act(async () => {
			const event = Object.values(mockDatabase.campusEvents)[0]
			window.history.pushState(
				{},
				"",
				`/app/planning/churches/${event.churchId}/events/${event.id}`,
			)
			window.dispatchEvent(new PopStateEvent("popstate"))
		})

		await waitFor(() => {
			expect(rendered?.container.textContent).toContain("Sunday Worship Service")
			expect(rendered?.container.textContent).toContain("Band")
		})

		const scheduleButton = rendered.container.querySelector<HTMLButtonElement>(
			'[aria-label="Schedule a volunteer for Worship leader"]',
		)
		expect(scheduleButton).not.toBeNull()
		await act(async () => scheduleButton?.click())

		await waitFor(() => {
			expect(document.body.textContent).toContain("Schedule volunteer")
		})

		const volunteerButton = document.body.querySelector<HTMLButtonElement>(
			'[aria-label^="Send "][aria-label$=" a request"]',
		)
		expect(volunteerButton).not.toBeNull()
		await act(async () => volunteerButton?.click())

		await waitFor(() => {
			expect(
				Object.values(mockDatabase.volunteerRequests).some(
					(request) => request.roleName === "Worship leader" && request.status === "pending",
				),
			).toBe(true)
		})
		const eventId = Object.keys(mockDatabase.campusEvents)[0]
		await act(async () => {
			await rendered?.queryClient.refetchQueries({
				queryKey: rendered?.apiClient.getCampusEventPlanning.queryKey({ event_id: eventId }),
			})
		})

		await waitFor(() => {
			expect(
				rendered?.container.querySelector(
					'[aria-label="Worship leader: 0 accepted and 1 pending of 1"]',
				),
			).not.toBeNull()
		})
	})

	it("shows the localized empty state when the viewer has no planning events", async () => {
		originalPath = `${window.location.pathname}${window.location.search}`
		window.history.replaceState({}, "", "/app")
		rendered = await renderApplication()
		restoreApiClient = replaceGlobalClientWith(rendered.apiClient)
		for (const eventId of Object.keys(mockDatabase.campusEvents))
			delete mockDatabase.campusEvents[eventId]

		await act(async () => {
			window.history.pushState({}, "", "/app/planning")
			window.dispatchEvent(new PopStateEvent("popstate"))
		})

		await waitFor(() => {
			expect(rendered?.container.textContent).toContain("No events are available to plan yet.")
		})
	})
})
