export type AuthProps = {
	email: string
	error: string | null
	onEmailChange: (email: string) => void
	onSignIn: () => void
}
