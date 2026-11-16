export type AuthProps = {
	email: string
	error: boolean
	onEmailChange: (email: string) => void
	onSignIn: () => void
}
