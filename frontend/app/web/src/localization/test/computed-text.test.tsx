import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ComputedText, Localized, LocalizationScope, TranslationProvider } from ".."

const catalog = {
	sourceLocale: "en",
	locales: { en: { "common.hello": "Hello" } },
} as const

describe("ComputedText", () => {
	it("does not add a wrapper during ordinary rendering", () => {
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={catalog}>
				<ComputedText value={42} />
			</TranslationProvider>,
		)

		expect(markup).toBe("42")
	})

	it("marks computed and localized text distinctly during inspection", () => {
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={catalog} initialLocalizationInspectionEnabled>
				<LocalizationScope name="test">
					<Localized str="common.hello" />
				</LocalizationScope>
				<ComputedText value="Calculated" />
			</TranslationProvider>,
		)

		expect(markup).toContain('data-localization-kind="localized"')
		expect(markup).toContain('data-localization-kind="computed"')
		expect(markup).toContain("outline:2px solid #f00")
		expect(markup).toContain("outline:2px dashed #006b8f")
	})

	it("uses a sentinel color for raw text and explicit markers for approved text", () => {
		const markup = renderToStaticMarkup(
			<TranslationProvider localizationTest={{ sentinelColor: "rebeccapurple" }} catalog={catalog}>
				<LocalizationScope name="test">
					<Localized str="common.hello" />
				</LocalizationScope>
				<ComputedText value="Calculated" />
				raw text
			</TranslationProvider>,
		)

		expect(markup).toContain('data-localization-test-container="true"')
		expect(markup).toContain("color: rebeccapurple")
		expect(markup).toContain('data-localization-kind="localized"')
		expect(markup).toContain("color:#14532d")
		expect(markup).toContain('data-localization-kind="computed"')
		expect(markup).toContain("color:#0c4a6e")
	})
})
