import { porphyraCatalog, type TranslationCatalog } from "@porphyra/frontend/localization"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { Auth } from "@/components/auth"
import { Dashboard } from "@/components/dashboard"
import { Welcome } from "@/components/welcome"
import {
	createLocalizedElementId,
	createTestIdentityStrategy,
	defaultIdentityStrategy,
	Localized,
	LocalizationScope,
	resolveTranslation,
	TranslationProvider,
	useLocalizationScopeId,
} from "."

const catalog: TranslationCatalog = {
	sourceLocale: "en",
	locales: {
		en: {
			"common.hello": "hello",
			"common.volunteerCount": {
				singular: "{count} volunteer",
				plural: "{count} volunteers",
			},
			"dashboard.church": "Church",
		},
		test: { "common.hello": "shared" },
	},
	contextual: {
		test: {
			"test:target:common.hello": {
				text: "test",
				presentation: { backgroundColor: "#FFFF00", color: "#000000", fontSize: "96px" },
			},
		},
	},
}

const _localizedPropTypeChecks = () => (
	<>
		<Localized str="dashboard.greeting" values={{ name: "Ada" }} />
		<Localized pluralize str="planning.volunteerCount" values={{ count: 2 }} />
		{/* @ts-expect-error Non-plural catalog entries cannot enable pluralization. */}
		<Localized pluralize str="planning.serviceRoles" />
		{/* @ts-expect-error Interpolation values are required when the selected entry declares them. */}
		<Localized str="dashboard.greeting" />
		{/* @ts-expect-error Entries without interpolation placeholders do not accept values. */}
		<Localized str="planning.serviceRoles" values={{ count: 1 }} />
		{/* @ts-expect-error Interpolation values cannot include undeclared placeholders. */}
		<Localized str="dashboard.greeting" values={{ name: "Ada", title: "Pastor" }} />
	</>
)

describe("localization resolution", () => {
	it("resolves shared translations, source fallback, interpolation, and contextual presentation", () => {
		const target = "test:target:common.hello"
		expect(resolveTranslation(catalog, "en", "common.hello", target)).toEqual({ text: "hello" })
		expect(resolveTranslation(catalog, "test", "common.hello", target)).toEqual({
			text: "test",
			presentation: { backgroundColor: "#FFFF00", color: "#000000", fontSize: "96px" },
		})
		expect(
			resolveTranslation(catalog, "test", "common.hello", "test:control:common.hello"),
		).toEqual({ text: "shared" })
		expect(
			resolveTranslation(catalog, "test", "dashboard.church", "dashboard:dashboard.church"),
		).toEqual({ text: "Church" })
	})

	it("selects a plural form only when pluralization is requested", () => {
		const target = "test:target:common.volunteerCount"
		expect(
			resolveTranslation(catalog, "en", "common.volunteerCount", target, { count: 1 }, true),
		).toEqual({ text: "1 volunteer" })
		expect(
			resolveTranslation(catalog, "en", "common.volunteerCount", target, { count: 2 }, true),
		).toEqual({ text: "2 volunteers" })
		expect(
			resolveTranslation(catalog, "en", "common.volunteerCount", target, { count: 2 }),
		).toEqual({ text: "2 volunteer" })
	})
})

describe("named localization scopes", () => {
	it("forms readable IDs from the explicit scope name and translation key", () => {
		expect(defaultIdentityStrategy({ scopeName: "dashboard.church-cards" })).toBe(
			"dashboard.church-cards",
		)
		expect(createLocalizedElementId("dashboard.church-cards", "dashboard.church")).toBe(
			"dashboard.church-cards:dashboard.church",
		)
	})

	it("keeps IDs stable across ordinary wrappers, nested scopes, and equivalent mounts", () => {
		const render = (wrap: boolean, nest: boolean) =>
			renderToStaticMarkup(
				<TranslationProvider catalog={catalog}>
					{nest ? (
						<LocalizationScope name="outer">
							<LocalizationScope name="action">
								<Localized asChild str="common.hello">
									<button type="button" />
								</Localized>
							</LocalizationScope>
						</LocalizationScope>
					) : (
						<LocalizationScope name="action">
							{wrap ? (
								<div>
									<Localized asChild str="common.hello">
										<button type="button" />
									</Localized>
								</div>
							) : (
								<Localized asChild str="common.hello">
									<button type="button" />
								</Localized>
							)}
						</LocalizationScope>
					)}
				</TranslationProvider>,
			)
		for (const markup of [
			render(false, false),
			render(true, false),
			render(false, true),
			render(false, false),
		]) {
			expect(markup).toContain('data-localization-id="action:common.hello"')
		}
	})

	it("uses the same ID for any number or order of repeated items in a scope", () => {
		const render = (items: readonly string[]) =>
			renderToStaticMarkup(
				<TranslationProvider catalog={catalog}>
					<LocalizationScope name="dashboard.church-cards">
						{items.map((item) => (
							<div key={item}>
								<Localized asChild str="dashboard.church">
									<span />
								</Localized>
							</div>
						))}
					</LocalizationScope>
				</TranslationProvider>,
			)
		for (const items of [[], ["a"], ["a", "b", "c"], ["c", "a"], ["b"]]) {
			expect(
				render(items).match(/data-localization-id="dashboard\.church-cards:dashboard\.church"/g) ??
					[],
			).toHaveLength(items.length)
		}
	})

	it("separates semantically named scopes without depending on child structure", () => {
		const ScopeId = () => <output>{useLocalizationScopeId()}</output>
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={catalog}>
				<LocalizationScope name="target">
					<ScopeId />
				</LocalizationScope>
				<div>
					<LocalizationScope name="control">
						<ScopeId />
					</LocalizationScope>
				</div>
			</TranslationProvider>,
		)
		expect(markup).toContain("<output>target</output>")
		expect(markup).toContain("<output>control</output>")
	})

	it("requires a scope and a nonempty name", () => {
		expect(() =>
			renderToStaticMarkup(
				<TranslationProvider catalog={catalog}>
					<Localized str="common.hello" />
				</TranslationProvider>,
			),
		).toThrow(/requires an enclosing LocalizationScope/)
		expect(() =>
			renderToStaticMarkup(
				<TranslationProvider catalog={catalog}>
					<LocalizationScope name="">
						<Localized str="common.hello" />
					</LocalizationScope>
				</TranslationProvider>,
			),
		).toThrow(/names must not be empty/)
	})

	it("uses injected, namespaced fixture identities through the same translation pipeline", () => {
		const strategy = createTestIdentityStrategy("test")
		expect(strategy({ scopeName: "irrelevant", testKey: "target" })).toBe("test:target")
		expect(strategy({ scopeName: "irrelevant", testKey: "control" })).toBe("test:control")
		const markup = renderToStaticMarkup(
			<TranslationProvider catalog={catalog} identityStrategy={strategy}>
				<LocalizationScope name="greeting" testKey="target">
					<Localized asChild str="common.hello">
						<span />
					</Localized>
				</LocalizationScope>
				<LocalizationScope name="greeting" testKey="control">
					<Localized asChild str="common.hello">
						<span />
					</Localized>
				</LocalizationScope>
			</TranslationProvider>,
		)
		expect(markup).toContain('data-localization-id="test:target:common.hello"')
		expect(markup).toContain('data-localization-id="test:control:common.hello"')
		expect(() =>
			renderToStaticMarkup(
				<TranslationProvider catalog={catalog}>
					<LocalizationScope name="greeting" testKey="target">
						<Localized str="common.hello" />
					</LocalizationScope>
				</TranslationProvider>,
			),
		).toThrow(/testKey requires an injected test identity strategy/)
	})

	it("renders actual welcome, sign-in, and repeated dashboard cards", () => {
		const churches = ["first", "second", "third"].map((id) => ({
			id,
			name: id,
			avatarUrl: "",
			description: "",
			campuses: [],
			ministries: [],
		}))
		const dashboard = renderToStaticMarkup(
			<TranslationProvider catalog={porphyraCatalog}>
				<LocalizationScope name="app-shell">
					<Dashboard churches={churches} isError={false} isLoading={false} />
				</LocalizationScope>
			</TranslationProvider>,
		)
		expect(dashboard.match(/>Church</g)).toHaveLength(3)
		expect(dashboard).toContain('data-localization-id="dashboard.church-cards:dashboard.church"')
		expect(
			renderToStaticMarkup(
				<TranslationProvider catalog={porphyraCatalog}>
					<Welcome onSignIn={() => {}} />
					<Auth email="" error={true} onEmailChange={() => {}} onSignIn={() => {}} />
				</TranslationProvider>,
			),
		).toContain("Unable to sign in. Please try again.")
	})
})
