// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRoot, type Root } from "react-dom/client"
import { act } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { porphyraCatalog, type TranslationCatalog } from "@porphyra/frontend/localization"
import { Dashboard } from "@/components/dashboard"
import {
	createLocalizedElementId,
	createTestIdentityStrategy,
	defaultIdentityStrategy,
	Localized,
	LocalizationScope,
	TranslationProvider,
	useLocalizationScopeId,
	useTranslation,
} from "."

const identityStrategy = createTestIdentityStrategy("fixture")
const targetId = createLocalizedElementId(
	identityStrategy({ scopeName: "greeting", testKey: "target" }),
	"common.hello",
)
const catalog: TranslationCatalog = {
	sourceLocale: "en",
	locales: { en: { "common.hello": "hello" }, test: { "common.hello": "hello" } },
	contextual: {
		test: {
			[targetId]: {
				text: "test",
				presentation: { backgroundColor: "#FFFF00", color: "#000000", fontSize: "96px" },
			},
		},
	},
}

const LocaleControls = () => {
	const { setLocale } = useTranslation()
	return (
		<>
			<button onClick={() => setLocale("test")} type="button">
				Test locale
			</button>
			<button onClick={() => setLocale("en")} type="button">
				Source locale
			</button>
		</>
	)
}

let root: Root | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
	act(() => root?.unmount())
	container?.remove()
	root = undefined
	container = undefined
})

describe("contextual localization integration", () => {
	it("applies and reverses an injected contextual text and presentation override", () => {
		container = document.createElement("div")
		document.body.append(container)
		root = createRoot(container)
		act(() => {
			root?.render(
				<TranslationProvider catalog={catalog} identityStrategy={identityStrategy}>
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
					<LocaleControls />
					<p data-testid="surrounding">unchanged</p>
				</TranslationProvider>,
			)
		})

		const [target, control] = Array.from(
			container.querySelectorAll<HTMLElement>("[data-localization-id]"),
		)
		expect(target.textContent).toBe("hello")
		expect(control.textContent).toBe("hello")
		expect(target.dataset.localizationId).toBe(targetId)
		expect(control.dataset.localizationId).not.toBe(target.dataset.localizationId)
		expect(target.style.fontSize).toBe("")
		expect(control.style.backgroundColor).toBe("")

		act(() => container?.querySelector<HTMLButtonElement>("button")?.click())
		const targetStyle = getComputedStyle(target)
		const controlStyle = getComputedStyle(control)
		expect(target.textContent).toBe("test")
		expect(control.textContent).toBe("hello")
		expect(targetStyle.fontSize).toBe("96px")
		expect(targetStyle.backgroundColor).toBe("rgb(255, 255, 0)")
		expect(targetStyle.color).toBe("rgb(0, 0, 0)")
		expect(control.style.fontSize).toBe("")
		expect(control.style.backgroundColor).toBe("")
		expect(container.querySelector("[data-testid=surrounding]")?.textContent).toBe("unchanged")

		act(() => container?.querySelectorAll<HTMLButtonElement>("button")[1]?.click())
		expect(target.textContent).toBe("hello")
		expect(control.textContent).toBe("hello")
		expect(target.style.fontSize).toBe("")
		expect(target.style.backgroundColor).toBe("")
		expect(target.dataset.localizationId).toBe(targetId)

		act(() => container?.querySelector<HTMLButtonElement>("button")?.click())
		expect(target.textContent).toBe("test")
		expect(target.dataset.localizationId).toBe(targetId)
	})

	it("keeps a list scope stable for zero, added, removed, and reordered items and applies one override to all instances", () => {
		const strategy = createTestIdentityStrategy("iterative-fixture")
		const scopeId = strategy({ scopeName: "dashboard.church-cards", testKey: "church-list" })
		const listId = createLocalizedElementId(scopeId, "dashboard.church")
		const listCatalog: TranslationCatalog = {
			sourceLocale: "en",
			locales: {
				en: { "dashboard.church": "Church" },
				test: { "dashboard.church": "Church" },
			},
			contextual: {
				test: {
					[listId]: {
						text: "test",
						presentation: {
							backgroundColor: "#FFFF00",
							color: "#000000",
							fontSize: "96px",
						},
					},
				},
			},
		}
		const ScopeId = () => <output data-testid="scope-id">{useLocalizationScopeId()}</output>
		const renderList = (churches: readonly string[]) => (
			<TranslationProvider catalog={listCatalog} identityStrategy={strategy}>
				<LocalizationScope name="dashboard.church-cards" testKey="church-list">
					<ScopeId />
					{churches.map((churchId) => (
						<div key={churchId}>
							<Localized asChild str="dashboard.church">
								<span />
							</Localized>
						</div>
					))}
				</LocalizationScope>
				<LocaleControls />
				<p data-testid="surrounding">unchanged</p>
			</TranslationProvider>
		)

		container = document.createElement("div")
		document.body.append(container)
		root = createRoot(container)
		const assertList = (count: number, text: string, overridden: boolean) => {
			expect(container?.querySelector("[data-testid=scope-id]")?.textContent).toBe(scopeId)
			const elements = container?.querySelectorAll<HTMLElement>("[data-localization-id]") ?? []
			expect(elements).toHaveLength(count)
			for (const element of elements) {
				expect(element.dataset.localizationId).toBe(listId)
				expect(element.textContent).toBe(text)
				expect(getComputedStyle(element).fontSize).toBe(overridden ? "96px" : "")
				if (overridden) {
					expect(getComputedStyle(element).backgroundColor).toBe("rgb(255, 255, 0)")
					expect(getComputedStyle(element).color).toBe("rgb(0, 0, 0)")
				} else {
					expect(element.style.backgroundColor).toBe("")
					expect(element.style.color).toBe("")
				}
			}
			expect(container?.querySelector("[data-testid=surrounding]")?.textContent).toBe("unchanged")
		}

		act(() => root?.render(renderList([])))
		assertList(0, "Church", false)
		act(() => root?.render(renderList(["a"])))
		assertList(1, "Church", false)
		act(() => root?.render(renderList(["a", "b", "c"])))
		assertList(3, "Church", false)
		act(() => container?.querySelector<HTMLButtonElement>("button")?.click())
		assertList(3, "test", true)
		act(() => root?.render(renderList(["c", "a"])))
		assertList(2, "test", true)
		act(() => root?.render(renderList(["b"])))
		assertList(1, "test", true)
		act(() => root?.render(renderList([])))
		assertList(0, "test", true)
		act(() => root?.render(renderList(["a", "b"])))
		assertList(2, "test", true)
		act(() => container?.querySelectorAll<HTMLButtonElement>("button")[1]?.click())
		assertList(2, "Church", false)
	})

	it("allows a conditional message to unmount and remount in the same regular scope", () => {
		const renderMessage = (visible: boolean) => (
			<TranslationProvider catalog={catalog}>
				<LocalizationScope name="sign-in">
					<div>{visible && <Localized str="common.hello" />}</div>
				</LocalizationScope>
			</TranslationProvider>
		)
		container = document.createElement("div")
		document.body.append(container)
		root = createRoot(container)
		act(() => root?.render(renderMessage(true)))
		expect(container.textContent).toBe("hello")
		act(() => root?.render(renderMessage(false)))
		expect(container.textContent).toBe("")
		act(() => root?.render(renderMessage(true)))
		expect(container.textContent).toBe("hello")
	})

	it("localizes every real dashboard card under its shared parent scope without affecting the summary", () => {
		const scopeId = defaultIdentityStrategy({ scopeName: "dashboard.church-cards" })
		const churchId = createLocalizedElementId(scopeId, "dashboard.church")
		const dashboardCatalog: TranslationCatalog = {
			...porphyraCatalog,
			contextual: {
				test: {
					[churchId]: {
						text: "test",
						presentation: {
							backgroundColor: "#FFFF00",
							color: "#000000",
							fontSize: "96px",
						},
					},
				},
			},
		}
		const churches = ["a", "b"].map((id) => ({
			id,
			name: id,
			avatarUrl: "",
			description: "",
			campuses: [],
			ministries: [],
		}))
		container = document.createElement("div")
		document.body.append(container)
		root = createRoot(container)
		act(() =>
			root?.render(
				<TranslationProvider catalog={dashboardCatalog}>
					<LocalizationScope name="app-shell">
						<Dashboard churches={churches} isError={false} isLoading={false} />
					</LocalizationScope>
					<LocaleControls />
				</TranslationProvider>,
			),
		)
		expect(container.textContent).toContain("2 churches")
		expect(container.textContent?.match(/Church/g)).toHaveLength(2)
		act(() => container?.querySelector<HTMLButtonElement>("button")?.click())
		const targets = container.querySelectorAll<HTMLElement>(`[data-localization-id="${churchId}"]`)
		expect(targets).toHaveLength(2)
		for (const target of targets) {
			expect(target.textContent).toBe("test")
			expect(getComputedStyle(target).fontSize).toBe("96px")
			expect(getComputedStyle(target).backgroundColor).toBe("rgb(255, 255, 0)")
			expect(getComputedStyle(target).color).toBe("rgb(0, 0, 0)")
		}
		expect(container.textContent).toContain("2 churches")
		act(() => container?.querySelectorAll<HTMLButtonElement>("button")[1]?.click())
		expect(container.textContent?.match(/Church/g)).toHaveLength(2)
		const restored = container.querySelectorAll<HTMLElement>(`[data-localization-id="${churchId}"]`)
		expect(restored).toHaveLength(2)
		for (const target of restored) {
			expect(target.style.fontSize).toBe("")
			expect(target.style.backgroundColor).toBe("")
			expect(target.style.color).toBe("")
		}
	})
})
