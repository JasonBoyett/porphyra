// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ScheduleFilters } from "../schedule-filters"
import { UpcomingAssignments } from "../upcoming-assignments"
import { TranslationProvider } from "@/localization"
import { assertNoLocalizationLeaks } from "@/test/helpers"
import { porphyraCatalog } from "@porphyra/frontend/localization"

let container: HTMLDivElement | undefined
let root: Root | undefined

const render = (component: React.ReactNode) => {
	container = document.createElement("div")
	document.body.append(container)
	root = createRoot(container)
	act(() => {
		root?.render(
			<TranslationProvider catalog={porphyraCatalog} localizationTest>
				{component}
			</TranslationProvider>,
		)
	})
	return container
}

afterEach(() => {
	if (container !== undefined) assertNoLocalizationLeaks(container)
	act(() => root?.unmount())
	container?.remove()
	container = undefined
	root = undefined
})

describe("volunteer schedule components", () => {
	it("offers campus and ministry filters and reports the selected values", () => {
		const onCampusChange = vi.fn()
		const onMinistryChange = vi.fn()
		const rendered = render(
			<ScheduleFilters
				campusId="all-campuses"
				campuses={[{ id: "downtown", label: "Downtown" }]}
				ministry="all-ministries"
				ministries={["Music"]}
				onCampusChange={onCampusChange}
				onMinistryChange={onMinistryChange}
			/>,
		)

		const [campus, ministry] = rendered.querySelectorAll<HTMLSelectElement>("select")
		campus.value = "downtown"
		campus.dispatchEvent(new Event("change", { bubbles: true }))
		ministry.value = "Music"
		ministry.dispatchEvent(new Event("change", { bubbles: true }))

		expect(campus.textContent).toContain("All campuses")
		expect(ministry.textContent).toContain("All my ministries")
		expect(onCampusChange).toHaveBeenCalledWith("downtown")
		expect(onMinistryChange).toHaveBeenCalledWith("Music")
	})

	it("shows the upcoming assignment empty state", () => {
		const rendered = render(<UpcomingAssignments assignments={[]} />)

		expect(rendered.textContent).toContain("0 assignments")
		expect(rendered.textContent).toContain("Nothing scheduled here")
		expect(rendered.textContent).toContain("Try another campus or one of your ministries.")
	})

	it("renders assignment data as computed text", () => {
		const rendered = render(
			<UpcomingAssignments
				assignments={[
					{
						campusId: "downtown",
						callTime: "9:30 AM",
						dateLabel: "Sunday, November 15, 2026",
						day: "15",
						dayOfWeek: "Sun",
						eventName: "Sunday Worship Service",
						eventStartsAt: "2026-11-15T16:00:00Z",
						eventStartTime: "10:00 AM",
						id: "assignment-1",
						location: "Downtown",
						mapUrl: "https://example.com/map",
						ministry: "Music",
						month: "Nov",
						note: "Bring your music stand.",
						roleName: "Keys",
						team: "Band",
					},
				]}
			/>,
		)

		expect(rendered.textContent).toContain("Sunday Worship Service")
		expect(rendered.textContent).toContain("Bring your music stand.")
	})
})
