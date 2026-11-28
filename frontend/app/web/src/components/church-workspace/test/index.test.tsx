import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { LocalizationScope, TranslationProvider } from "@/localization"
import { porphyraCatalog } from "@porphyra/frontend/localization"
import { MultiCampusChurchView } from "../multi-campus-view"
import { SingleCampusChurchView } from "../single-campus-view"
import type { ChurchWorkspaceChurch } from "../types"

const church: ChurchWorkspaceChurch = {
	id: "019b2680-2a8d-7000-8000-000000000001",
	avatarUrl: "https://example.com/church.png",
	name: "City Hope Church",
	description: "",
	campuses: [
		{
			id: "019b2680-2a8d-7000-8000-000000000002",
			name: "Downtown",
			location: {
				addressLine1: null,
				addressLine2: null,
				city: "Austin",
				countryCode: "US",
				postalCode: null,
				region: "Texas",
				timeZone: "America/Chicago",
			},
		},
	],
	ministries: [],
}

const renderLocalized = (component: React.ReactNode) =>
	renderToStaticMarkup(
		<TranslationProvider catalog={porphyraCatalog}>
			<LocalizationScope name="church-workspace-test">{component}</LocalizationScope>
		</TranslationProvider>,
	)

describe("church workspace views", () => {
	it("uses location language for a single-campus church", () => {
		const markup = renderLocalized(<SingleCampusChurchView church={church} />)

		expect(markup).toContain("Your location")
		expect(markup).toContain("Review your location")
		expect(markup).not.toContain("Your campuses")
	})

	it("uses campus management language for a multi-campus church", () => {
		const markup = renderLocalized(
			<MultiCampusChurchView
				church={{
					...church,
					campuses: [
						...church.campuses,
						{
							...church.campuses[0]!,
							id: "019b2680-2a8d-7000-8000-000000000003",
							name: "North",
						},
					],
				}}
			/>,
		)

		expect(markup).toContain("Your campuses")
		expect(markup).toContain("Review each campus")
		expect(markup).toContain("North")
	})
})
