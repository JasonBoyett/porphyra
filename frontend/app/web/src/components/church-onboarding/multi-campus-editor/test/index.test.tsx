import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { MultiCampusEditor } from ".."

const withLocalization = (component: React.ReactNode) => (
	<TranslationProvider catalog={porphyraCatalog}>{component}</TranslationProvider>
)

describe("MultiCampusEditor", () => {
	it("renders accessible validation, independent primary selection, and service choices", () => {
		const markup = renderToStaticMarkup(
			withLocalization(
				<MultiCampusEditor
					defaultTimeZone="America/Chicago"
					onChange={() => {}}
					value={{
						primaryCampusIndex: 1,
						campuses: [
							{ name: "", campusType: "physical", timeZone: "America/Chicago" },
							{
								name: "Online",
								campusType: "online",
								timeZone: "America/Chicago",
								recurringServices: [],
							},
						],
					}}
				/>,
			),
		)

		expect(markup).toContain('aria-invalid="true"')
		expect(markup).toContain('role="alert"')
		expect(markup).toContain('aria-pressed="true"')
		expect(markup).toContain("We don’t have services yet")
		expect(markup).toContain("Sunday")
	})

	it("does not prompt administrative campuses for a service by default", () => {
		const markup = renderToStaticMarkup(
			withLocalization(
				<MultiCampusEditor
					defaultTimeZone="America/Chicago"
					onChange={() => {}}
					value={{
						primaryCampusIndex: 0,
						campuses: [
							{ name: "Office", campusType: "administrative", timeZone: "America/Chicago" },
							{ name: "Care Center", campusType: "ministry_center", timeZone: "America/Chicago" },
						],
					}}
				/>,
			),
		)

		expect(markup.match(/Add weekly service/g)).toHaveLength(2)
		expect(markup).not.toContain("We don’t have services yet")
	})
})
