// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { Welcome } from ".."

let container: HTMLDivElement | undefined
let unmount: (() => void) | undefined

afterEach(() => {
	act(() => unmount?.())
	container?.remove()
})

describe("Welcome", () => {
	it("presents the product value and sends both entry actions to sign-in", async () => {
		const onSignIn = vi.fn()
		container = document.createElement("div")
		document.body.append(container)
		const root = createRoot(container)
		unmount = () => root.unmount()

		await act(async () => {
			root.render(
				<TranslationProvider catalog={porphyraCatalog} localizationTest>
					<Welcome onSignIn={onSignIn} />
				</TranslationProvider>,
			)
		})

		expect(container.textContent).toContain("Made for the people")
		await act(async () => {
			container?.querySelectorAll<HTMLButtonElement>("button").forEach((button) => button.click())
		})
		expect(onSignIn).toHaveBeenCalledTimes(2)
	})
})
