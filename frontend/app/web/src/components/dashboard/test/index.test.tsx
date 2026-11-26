import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { decorateApiClient } from "@/api/decorate-api-client"
import { TranslationProvider } from "@/localization"
import { mockApiClientTransport } from "@/test/mocks/api/transport"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { Dashboard } from ".."

describe("Dashboard", () => {
	it("renders the generated mock dashboard data with campuses and teams", async () => {
		const dashboard = await decorateApiClient(mockApiClientTransport).getDashboard()
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={porphyraCatalog} localizationTest>
				<Dashboard
					churches={dashboard.churches}
					isError={false}
					isLoading={false}
					viewerName={dashboard.viewer.name}
				/>
			</TranslationProvider>,
		)

		expect(markup).toContain(dashboard.churches[0].name)
		expect(markup).toContain(dashboard.churches[0].campuses[0].location.city)
		expect(markup).toContain(dashboard.churches[0].ministries[0].teams[0].name)
	})

	it("shows loading and service failure states with no churches", () => {
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={porphyraCatalog} localizationTest>
				<Dashboard churches={[]} isError isLoading viewerName={undefined} />
			</TranslationProvider>,
		)

		expect(markup).toContain("Loading churches")
		expect(markup).toContain("The API is not running yet")
		expect(markup).toContain("0 churches")
	})
})
