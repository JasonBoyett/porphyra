import { Heart, LogIn, Music2, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { WelcomeProps } from "./types"

export const Welcome = ({ onSignIn }: WelcomeProps) => (
	<main className="mx-auto grid min-h-screen max-w-280 items-center gap-16 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-12">
		<section className="max-w-162">
			<p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
				Church planning by Acts 2:44 Technology
			</p>
			<h1 className="font-serif text-5xl leading-[0.96] font-bold tracking-[-0.055em] md:text-[5.2rem]">
				Tools that help your church focus on ministry.
			</h1>
			<p className="my-6 text-lg leading-7 text-muted-foreground">
				Porphyra brings service planning, volunteer coordination, team schedules, and campus
				operations together in one dependable platform.
			</p>
			<div className="flex flex-wrap gap-3">
				<Button onClick={onSignIn} size="lg">
					<LogIn data-icon="inline-start" />
					Sign in
				</Button>
				<Button onClick={onSignIn} size="lg" variant="secondary">
					Create a free account
				</Button>
			</div>
			<p className="mt-4 text-sm text-muted-foreground">
				Free and open source. Built for churches of every size.
			</p>
		</section>
		<section className="branded-gradient-panel rounded-[2rem] p-6 text-[oklch(0.98_0.008_320)] shadow-2xl md:p-9">
			<div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
				<Heart />
			</div>
			<h2 className="mt-6 font-serif text-4xl leading-[1.05]">
				Made for the people who make Sunday happen.
			</h2>
			<p className="mt-4 leading-6 text-[oklch(0.9_0.035_320)]">
				We reduce administrative burden so staff and volunteers can serve people with more presence,
				care, and confidence.
			</p>
			<div className="mt-8 flex flex-col gap-3 font-semibold">
				<span className="flex items-center gap-2">
					<Music2 /> Plan together
				</span>
				<span className="flex items-center gap-2">
					<Users /> Serve together
				</span>
				<span className="flex items-center gap-2">
					<ShieldCheck /> Steward wisely
				</span>
			</div>
		</section>
	</main>
)
