import type { AuthSession } from "@porphyra/frontend/auth"

export type SignInInput = {
	email: string
}

export type AuthState = {
	isAuthenticated: boolean
	session: AuthSession | null
	signIn: (input: SignInInput) => Promise<void>
	signOut: () => void
}
