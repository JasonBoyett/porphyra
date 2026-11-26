// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import { ComputedText, TranslationProvider } from "@/localization"
import { getMockViewer, mockDatabase } from "@/test/mocks/api/database"
import { asViewer, assertNoLocalizationLeaks, renderApplication } from ".."

let root: Root | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
	act(() => root?.unmount())
	container?.remove()
	root = undefined
	container = undefined
})

describe("application render helpers", () => {
	it("uses a decorated mock client for the selected viewer", async () => {
		const alternateViewer = Object.values(mockDatabase.users).find(
			(user) => user.email !== "dev@a244.tech",
		)
		expect(alternateViewer).toBeDefined()
		const render = await asViewer(alternateViewer?.email ?? "", { skipLocalizationCheck: true })

		expect(render.viewer.email).toBe(alternateViewer?.email)
		expect(getMockViewer().id).toBe(render.viewer.id)
		expect((await render.apiClient.getDashboard()).viewer.email).toBe(alternateViewer?.email)

		await render.unmount()
	})

	it("resets database records and the viewer for every render", async () => {
		const selected = await asViewer("dev@a244.tech", { skipLocalizationCheck: true })
		mockDatabase.users[selected.viewer.id].name = "Changed in one test"
		await selected.unmount()

		const next = await renderApplication({ skipLocalizationCheck: true })
		expect(next.viewer.name).not.toBe("Changed in one test")
		expect((await next.apiClient.getDashboard()).viewer.id).toBe(next.viewer.id)
		await next.unmount()
	})

	it("detects intentional raw localization leaks while allowing marked text", () => {
		const approvedValue = "Approved value"
		container = document.createElement("div")
		document.body.append(container)
		root = createRoot(container)
		act(() => {
			root?.render(
				<TranslationProvider catalog={{ sourceLocale: "en", locales: { en: {} } }} localizationTest>
					<ComputedText value={approvedValue} />
					raw leak
				</TranslationProvider>,
			)
		})

		expect(() => assertNoLocalizationLeaks(container as HTMLDivElement)).toThrow("raw leak")
	})
})
