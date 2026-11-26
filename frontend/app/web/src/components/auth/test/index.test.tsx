// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { Auth } from ".."

let container: HTMLDivElement | undefined
let unmount: (() => void) | undefined

afterEach(() => {
	act(() => unmount?.())
	container?.remove()
	container = undefined
	unmount = undefined
})

describe("Auth", () => {
	it("updates the email and submits from either sign-in action", async () => {
		const onEmailChange = vi.fn()
		const onSignIn = vi.fn()
		container = document.createElement("div")
		document.body.append(container)
		const root = createRoot(container)
		unmount = () => root.unmount()

		await act(async () => {
			root.render(
				<TranslationProvider catalog={porphyraCatalog} localizationTest>
					<Auth
						email="member@example.com"
						error={false}
						onEmailChange={onEmailChange}
						onSignIn={onSignIn}
					/>
				</TranslationProvider>,
			)
		})

		const email = container.querySelector<HTMLInputElement>("#email")
		expect(email?.value).toBe("member@example.com")
		await act(async () => {
			if (email) {
				const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
				setValue?.call(email, "updated@example.com")
				email.dispatchEvent(new Event("input", { bubbles: true }))
			}
			container?.querySelectorAll<HTMLButtonElement>("button").forEach((button) => button.click())
		})

		expect(onEmailChange).toHaveBeenCalledWith("updated@example.com")
		expect(onSignIn).toHaveBeenCalledTimes(2)
	})

	it("announces a sign-in failure", async () => {
		container = document.createElement("div")
		document.body.append(container)
		const root = createRoot(container)
		unmount = () => root.unmount()

		await act(async () => {
			root.render(
				<TranslationProvider catalog={porphyraCatalog} localizationTest>
					<Auth email="member@example.com" error onEmailChange={() => {}} onSignIn={() => {}} />
				</TranslationProvider>,
			)
		})

		expect(container.querySelector('[role="alert"]')?.textContent).toContain("Unable to sign in")
	})
})
