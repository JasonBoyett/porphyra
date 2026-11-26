import { Link } from "@tanstack/react-router"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ComputedText, Localized, LocalizationScope, useLocalizedString } from "@/localization"
import type { AppShellProps } from "./types"

const AppShellContent = ({ children, onSignOut, viewer }: AppShellProps) => {
	const viewerName = viewer.name ?? "User"
	const { text: applicationAreas } = useLocalizedString("navigation.applicationAreas")

	return (
		<main>
			<header className="sticky top-0 z-5 flex items-center justify-between gap-2 border-b bg-background/85 px-4 py-3 backdrop-blur-md md:gap-8 md:px-[max(1.5rem,calc((100vw-1240px)/2))]">
				<Link
					className="inline-flex items-center gap-2 font-serif text-[1.4rem] font-bold"
					to="/app"
				>
					<img alt="" className="size-7 object-contain" src="/favicon.png" />
					<Localized str="common.porphyra" />
				</Link>
				<nav aria-label={applicationAreas} className="flex min-w-0 gap-1 overflow-x-auto">
					<Link
						activeProps={{ className: "bg-primary text-primary-foreground" }}
						className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
						to="/app"
					>
						<Localized str="navigation.overview" />
					</Link>
					<Link
						activeProps={{ className: "bg-primary text-primary-foreground" }}
						className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
						to="/app/planning"
					>
						<Localized str="navigation.planning" />
					</Link>
					<Link
						activeProps={{ className: "bg-primary text-primary-foreground" }}
						className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
						to="/app/volunteers"
					>
						<Localized str="navigation.volunteer" />
					</Link>
					<Link
						activeProps={{ className: "bg-primary text-primary-foreground" }}
						className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
						to="/app/kiosk"
					>
						<Localized str="navigation.kiosk" />
					</Link>
				</nav>
				<Button className="shrink-0 rounded-full" onClick={onSignOut} variant="secondary">
					<Avatar size="sm">
						<AvatarImage alt={`${viewerName} profile`} src={viewer.avatarUrl} />
						<AvatarFallback>
							<ComputedText value={viewerName.slice(0, 1)} />
						</AvatarFallback>
					</Avatar>
					<span className="hidden sm:inline">
						<Localized str="common.signOut" />
					</span>
				</Button>
			</header>
			{children}
		</main>
	)
}

export const AppShell = (props: AppShellProps) => (
	<LocalizationScope name="app-shell">
		<AppShellContent {...props} />
	</LocalizationScope>
)
