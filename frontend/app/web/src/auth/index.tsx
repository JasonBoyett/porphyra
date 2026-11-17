import type { AuthSession } from "@porphyra/frontend/auth"
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
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

export const AuthProvider = ({ children }: PropsWithChildren) => {
	const [session, setSession] = useState<AuthSession | null>(getStoredSession)

	const signIn = useCallback(async ({ email }: SignInInput) => {
		const response = await fetch(`${authUrl}/api/v1/auth/sign-in`, {
			body: JSON.stringify({ email }),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		})

		if (!response.ok) throw new Error("Unable to sign in.")

		const nextSession = (await response.json()) as AuthSession
		sessionStorage.setItem(authStorageKey, JSON.stringify(nextSession))
		sessionStorage.removeItem(legacyAccessTokenStorageKey)
		setSession(nextSession)
	}, [])

	const signOut = useCallback(() => {
		sessionStorage.removeItem(authStorageKey)
		sessionStorage.removeItem(legacyAccessTokenStorageKey)
		setSession(null)
	}, [])

	const auth = useMemo<AuthState>(
		() => ({
			isAuthenticated: session !== null,
			session,
			signIn,
			signOut,
		}),
		[session, signIn, signOut],
	)

	return <authContext.Provider value={auth}>{children}</authContext.Provider>
}

export const useAuth = () => {
	const auth = useContext(authContext)
	if (auth === null) throw new Error("useAuth must be used within an AuthProvider")
	return auth
}
