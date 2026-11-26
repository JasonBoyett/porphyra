import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Kiosk } from ".."
import { LocalizationScope, TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"

describe("Kiosk", () => {
	it("uses the supplied workspace title and description", () => {
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={porphyraCatalog}>
				<LocalizationScope name="test">
					<Kiosk description="Coordinate this Sunday's teams." title="Service kiosk" />
				</LocalizationScope>
			</TranslationProvider>,
		)

		expect(markup).toContain("Service kiosk")
		expect(markup).toContain("Coordinate this Sunday&#x27;s teams.")
		expect(markup).toContain("Open Service kiosk")
	})
})
