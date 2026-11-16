import { Heart, LogIn, Music2, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Localized, LocalizationScope } from "@/localization"
import type { WelcomeProps } from "./types"

export const Welcome = ({ onSignIn }: WelcomeProps) => (
	<LocalizationScope name="welcome">
		<main className="mx-auto grid min-h-screen max-w-280 items-center gap-16 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-12">
			<section className="max-w-162">
				<p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
					<Localized str="welcome.eyebrow" />
				</p>
				<h1 className="font-serif text-5xl leading-[0.96] font-bold tracking-[-0.055em] md:text-[5.2rem]">
					<Localized str="welcome.title" />
				</h1>
				<p className="my-6 text-lg leading-7 text-muted-foreground">
					<Localized str="welcome.description" />
				</p>
				<div className="flex flex-wrap gap-3">
					<Button onClick={onSignIn} size="lg">
						<LogIn data-icon="inline-start" />
						<Localized str="auth.signIn" />
					</Button>
					<Button onClick={onSignIn} size="lg" variant="secondary">
						<Localized str="welcome.createAccount" />
					</Button>
				</div>
				<p className="mt-4 text-sm text-muted-foreground">
					<Localized str="welcome.openSource" />
				</p>
			</section>
			<section className="branded-gradient-panel rounded-[2rem] p-6 text-[oklch(0.98_0.008_320)] shadow-2xl md:p-9">
				<div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
					<Heart />
				</div>
				<h2 className="mt-6 font-serif text-4xl leading-[1.05]">
					<Localized str="welcome.madeFor" />
				</h2>
				<p className="mt-4 leading-6 text-[oklch(0.9_0.035_320)]">
					<Localized str="welcome.madeForDescription" />
				</p>
				<div className="mt-8 flex flex-col gap-3 font-semibold">
					<span className="flex items-center gap-2">
						<Music2 /> <Localized str="welcome.planTogether" />
					</span>
					<span className="flex items-center gap-2">
						<Users /> <Localized str="welcome.serveTogether" />
					</span>
					<span className="flex items-center gap-2">
						<ShieldCheck /> <Localized str="welcome.stewardWisely" />
					</span>
				</div>
			</section>
		</main>
	</LocalizationScope>
)
