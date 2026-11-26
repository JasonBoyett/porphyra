// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest"

import { renderApplication } from "@/test/helpers"

afterEach(() => {
	window.history.replaceState({}, "", "/")
})

describe("authenticated application shell", () => {
	it("renders the dashboard checkpoint with approved API copy", async () => {
		window.history.replaceState({}, "", "/app")
		const rendered = await renderApplication()

		await vi.waitFor(() => {
			expect(rendered.container.textContent).toContain("Serve your churches with clarity")
		})
		expect(rendered.container.querySelector("nav")?.textContent).toContain("Planning")
		expect(rendered.container.textContent).toContain("Grace Harbor Church")

		await expect(rendered.unmount()).resolves.toBeUndefined()
	})
})
