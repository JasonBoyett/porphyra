import type { AuthSession } from "@porphyra/frontend/auth"
import {
	createContext,
	useContext,
	useMemo,
	useState,
	useSyncExternalStore,
	type PropsWithChildren,
} from "react"

import type { AuthState, SignInInput } from "./types"

const authContext = createContext<AuthState | null>(null)
const authStorageKey = "porphyra-auth-session"
const legacyAccessTokenStorageKey = "porphyra-access-token"
const authUrl = import.meta.env.VITE_AUTH_URL ?? "http://localhost:4000"

export const getStoredSession = (): AuthSession | null => {
	const storedSession = sessionStorage.getItem(authStorageKey)

	if (storedSession !== null) {
		try {
			const session = JSON.parse(storedSession) as Partial<AuthSession>
			if (typeof session.accessToken === "string" && typeof session.email === "string") {
				return { accessToken: session.accessToken, email: session.email }
			}
		} catch {
			sessionStorage.removeItem(authStorageKey)
		}
	}

	const legacyAccessToken = sessionStorage.getItem(legacyAccessTokenStorageKey)
	if (legacyAccessToken === null) return null

	return { accessToken: legacyAccessToken, email: "" }
}

class BrowserAuthStore {
	#listeners = new Set<() => void>()
	#session = getStoredSession()

	public getSnapshot = () => this.#session

	public subscribe = (listener: () => void) => {
		this.#listeners.add(listener)
		return () => this.#listeners.delete(listener)
	}

	public signIn = async ({ email }: SignInInput) => {
		const response = await fetch(`${authUrl}/api/v1/auth/sign-in`, {
			body: JSON.stringify({ email }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		if (!response.ok) throw new Error("Unable to sign in.")

		const session = (await response.json()) as AuthSession
		sessionStorage.setItem(authStorageKey, JSON.stringify(session))
		sessionStorage.removeItem(legacyAccessTokenStorageKey)
		this.#setSession(session)
	}

	public signOut = () => {
		sessionStorage.removeItem(authStorageKey)
		sessionStorage.removeItem(legacyAccessTokenStorageKey)
		this.#setSession(null)
	}

	#setSession(session: AuthSession | null) {
		this.#session = session
		for (const listener of this.#listeners) listener()
	}
}

export type AuthProviderProps = PropsWithChildren<{
	/** Supplies an isolated auth state, primarily for application tests. */
	auth?: AuthState
}>

export const AuthProvider = ({ auth: providedAuth, children }: AuthProviderProps) => {
	const [authStore] = useState(() => new BrowserAuthStore())
	const session = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot)

	const auth = useMemo<AuthState>(
		() => ({
			isAuthenticated: session !== null,
			session,
			signIn: authStore.signIn,
			signOut: authStore.signOut,
		}),
		[authStore, session],
	)

	return <authContext.Provider value={providedAuth ?? auth}>{children}</authContext.Provider>
}

export const useAuth = () => {
	const auth = useContext(authContext)
	if (auth === null) throw new Error("useAuth must be used within an AuthProvider")
	return auth
}
