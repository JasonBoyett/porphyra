export type AppShellProps = {
	children: React.ReactNode
	onSignOut: () => void
	viewer: {
		avatarUrl?: string
		name?: string
	}
}
