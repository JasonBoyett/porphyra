import { QueryClient } from "@tanstack/react-query"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"

import { decorateApiClient } from "@/api/decorate-api-client"
import type { ApiClient } from "@/api/client-types"
import { App } from "@/app"
import { createApplicationDependencies } from "@/app-dependencies"
import type { AuthState } from "@/auth/types"
import { defaultLocalizationTestSentinelColor } from "@/localization"
import {
	getMockViewer,
	resetMockDatabase,
	setMockViewer,
	type MockUser,
} from "@/test/mocks/api/database"
import { mockApiClientTransport } from "@/test/mocks/api/transport"

export type MockViewer = MockUser | string

export type ApplicationRenderOptions = {
	auth?: AuthState
	skipLocalizationCheck?: boolean
}

export type RenderedApplication = {
	asViewer: (viewer: MockViewer, options?: ApplicationRenderOptions) => Promise<RenderedApplication>
	apiClient: ApiClient
	container: HTMLDivElement
	queryClient: QueryClient
	unmount: () => Promise<void>
	viewer: MockUser
}

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	})

const ensureTestBrowserAPIs = () => {
	if (typeof window === "undefined") return
	if (window.matchMedia === undefined) {
		window.matchMedia = () =>
			({
				addEventListener: () => undefined,
				addListener: () => undefined,
				dispatchEvent: () => false,
				matches: false,
				media: "",
				onchange: null,
				removeEventListener: () => undefined,
				removeListener: () => undefined,
			}) as unknown as MediaQueryList
	}
	window.scrollTo = () => undefined
}

const viewerIdentifier = (viewer: MockViewer) => (typeof viewer === "string" ? viewer : viewer.id)

const createMockAuthState = (viewer: MockUser): AuthState => ({
	isAuthenticated: true,
	session: { accessToken: `mock:${viewer.id}`, email: viewer.email },
	signIn: async () => undefined,
	signOut: () => undefined,
})

const isMeaningfulVisibleText = (node: Text): boolean => {
	if (node.data.trim() === "") return false
	const parent = node.parentElement
	if (parent === null || parent.closest("[aria-hidden='true'], script, style, template") !== null)
		return false
	const style = getComputedStyle(parent)
	return style.display !== "none" && style.visibility !== "hidden"
}

/**
 * Fails when visible text inherits the localization test sentinel rather than
 * being marked by Localized or ComputedText.
 */
export const assertNoLocalizationLeaks = (container: HTMLElement): void => {
	const testContainer = container.querySelector<HTMLElement>(
		"[data-localization-test-container='true']",
	)
	if (testContainer === null) return

	const sentinelColor = getComputedStyle(testContainer).color
	const leaks: string[] = []
	const walker = document.createTreeWalker(testContainer, NodeFilter.SHOW_TEXT)
	let node = walker.nextNode()
	while (node !== null) {
		const textNode = node as Text
		const parent = textNode.parentElement
		const hasApproval = parent?.closest("[data-localization-kind]") !== null
		if (
			!hasApproval &&
			isMeaningfulVisibleText(textNode) &&
			getComputedStyle(parent as Element).color === sentinelColor
		) {
			leaks.push(textNode.data.trim())
		}
		node = walker.nextNode()
	}
	if (leaks.length > 0) {
		throw new Error(
			`Unapproved visible text inherited the localization sentinel (${defaultLocalizationTestSentinelColor}): ${leaks.join(", ")}`,
		)
	}
}

const renderMockApplication = async (
	viewer: MockUser,
	options: ApplicationRenderOptions,
): Promise<RenderedApplication> => {
	ensureTestBrowserAPIs()
	const container = document.createElement("div")
	const root = createRoot(container)
	const queryClient = createTestQueryClient()
	const apiClient = decorateApiClient(mockApiClientTransport)

	await act(async () => {
		root.render(
			<App
				dependencies={createApplicationDependencies({
					apiClient,
					auth: options.auth ?? createMockAuthState(viewer),
					queryClient,
					syncEnabled: false,
				})}
				localizationTest={!options.skipLocalizationCheck}
			/>,
		)
	})

	return {
		asViewer: (nextViewer, nextOptions = {}) => asViewer(nextViewer, nextOptions),
		apiClient,
		container,
		queryClient,
		unmount: async () => {
			try {
				if (!options.skipLocalizationCheck) assertNoLocalizationLeaks(container)
			} finally {
				await act(async () => root.unmount())
				queryClient.clear()
				resetMockDatabase()
				container.remove()
			}
		},
		viewer,
	}
}

/** Renders the app as the seed development user with fresh mock state. */
export const renderApplication = async (
	options: ApplicationRenderOptions = {},
): Promise<RenderedApplication> => {
	resetMockDatabase()
	return renderMockApplication(getMockViewer(), options)
}

/** Resets mock state, selects a seeded viewer, and renders an authenticated app. */
export const asViewer = async (
	viewer: MockViewer,
	options: ApplicationRenderOptions = {},
): Promise<RenderedApplication> => {
	resetMockDatabase()
	const selectedViewer = setMockViewer(viewerIdentifier(viewer))
	return renderMockApplication(selectedViewer, options)
}

export const createAuthenticatedTestState = (
	session: NonNullable<AuthState["session"]>,
): AuthState => ({
	isAuthenticated: true,
	session,
	signIn: async () => undefined,
	signOut: () => undefined,
})

export const createAnonymousTestState = (): AuthState => ({
	isAuthenticated: false,
	session: null,
	signIn: async () => undefined,
	signOut: () => undefined,
})
