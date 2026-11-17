// @vitest-environment jsdom

import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AuthProvider, useAuth } from "."
import type { AuthState } from "./types"

const renderAuth = async () => {
	const container = document.createElement("div")
	const root = createRoot(container)
	let auth: AuthState | undefined

	const AuthProbe = () => {
		auth = useAuth()
		return null
	}

	await act(() => {
		root.render(
			<AuthProvider>
				<AuthProbe />
			</AuthProvider>,
		)
	})

	return {
		getAuth: () => {
			if (auth === undefined) throw new Error("AuthProvider did not render")
			return auth
		},
		root,
	}
}

const mountedRoots: Root[] = []

beforeEach(() => {
	sessionStorage.clear()
})

afterEach(async () => {
	vi.unstubAllGlobals()

	await act(() => {
		for (const root of mountedRoots.splice(0)) root.unmount()
	})
})

describe("AuthProvider", () => {
	it("restores the legacy access token during the storage migration", async () => {
		sessionStorage.setItem("porphyra-access-token", "legacy-token")
		const rendered = await renderAuth()
		mountedRoots.push(rendered.root)

		expect(rendered.getAuth().session).toEqual({
			accessToken: "legacy-token",
			email: "",
		})
	})

	it("owns sign-in persistence and sign-out cleanup", async () => {
		const fetchMock = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						accessToken: "new-token",
						email: "person@example.com",
					}),
					{ headers: { "Content-Type": "application/json" } },
				),
			),
		)
		vi.stubGlobal("fetch", fetchMock)

		const rendered = await renderAuth()
		mountedRoots.push(rendered.root)

		await act(() => rendered.getAuth().signIn({ email: "person@example.com" }))

		expect(fetchMock).toHaveBeenCalledWith(
			"http://localhost:4000/api/v1/auth/sign-in",
			expect.objectContaining({ method: "POST" }),
		)
		expect(rendered.getAuth().session).toEqual({
			accessToken: "new-token",
			email: "person@example.com",
		})
		expect(JSON.parse(sessionStorage.getItem("porphyra-auth-session") ?? "null")).toEqual({
			accessToken: "new-token",
			email: "person@example.com",
		})

		act(() => rendered.getAuth().signOut())

		expect(rendered.getAuth().isAuthenticated).toBe(false)
		expect(sessionStorage.getItem("porphyra-auth-session")).toBeNull()
	})

	it("does not create a session when sign-in fails", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
		)
		const rendered = await renderAuth()
		mountedRoots.push(rendered.root)

		await expect(
			act(() => rendered.getAuth().signIn({ email: "person@example.com" })),
		).rejects.toThrow("Unable to sign in.")
		expect(rendered.getAuth().session).toBeNull()
		expect(sessionStorage.getItem("porphyra-auth-session")).toBeNull()
	})
})
