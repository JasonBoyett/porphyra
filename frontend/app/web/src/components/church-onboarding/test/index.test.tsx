// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { ChurchOnboarding, getDeviceTimeZone } from ".."

let container: HTMLDivElement | undefined
let unmount: (() => void) | undefined

const setInputValue = (input: HTMLInputElement, value: string) => {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
	setter?.call(input, value)
	input.dispatchEvent(new Event("input", { bubbles: true }))
}

const buttonNamed = (name: string) =>
	[...(container?.querySelectorAll<HTMLButtonElement>("button") ?? [])].find(
		(button) => button.textContent?.trim() === name,
	)

afterEach(() => {
	act(() => unmount?.())
	container?.remove()
	container = undefined
	unmount = undefined
	vi.restoreAllMocks()
})

describe("ChurchOnboarding", () => {
	it("builds the single-location generated operation input with optional details", async () => {
		const onSubmit = vi.fn<(input: unknown) => Promise<unknown>>(async () => ({ id: "church-1" }))
		container = document.createElement("div")
		document.body.append(container)
		const root = createRoot(container)
		unmount = () => root.unmount()

		await act(async () => {
			root.render(
				<TranslationProvider catalog={porphyraCatalog} localizationTest>
					<ChurchOnboarding isPending={false} onSubmit={onSubmit as never} />
				</TranslationProvider>,
			)
		})

		await act(async () => buttonNamed("Create church")?.click())
		await act(async () => {
			buttonNamed("Add address")?.click()
			buttonNamed("Add weekly service")?.click()
		})

		const churchName = container.querySelector<HTMLInputElement>("#church-name")
		const city = container.querySelector<HTMLInputElement>("#city")
		const country = container.querySelector<HTMLInputElement>("#country-code")
		if (churchName && city && country) {
			setInputValue(churchName, "Grace Church")
			setInputValue(city, "Toronto")
			setInputValue(country, "ca")
		}

		await act(async () => {
			container?.querySelector<HTMLFormElement>("form")?.requestSubmit()
		})

		expect(onSubmit).toHaveBeenCalledOnce()
		const submittedInput = onSubmit.mock.calls[0]?.[0] as {
			idempotencyKey: string
		}
		expect(submittedInput).toMatchObject({
			name: "Grace Church",
			primaryCampusIndex: 0,
			campuses: [
				{
					address: { city: "Toronto", countryCode: "CA" },
					campusType: "physical",
					name: "Grace Church",
					recurringServices: [
						{ durationMinutes: 60, name: "Sunday Worship", startsAt: "09:00", weekday: 6 },
					],
				},
			],
		})
		expect(submittedInput.idempotencyKey).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		)
	})

	it("falls back to America/Chicago when device time zone detection fails", () => {
		vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
			throw new Error("unavailable")
		})

		expect(getDeviceTimeZone()).toBe("America/Chicago")
	})
})
