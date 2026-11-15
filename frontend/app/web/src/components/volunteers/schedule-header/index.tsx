import { Button } from "@/components/ui/button"
import type { VolunteerScheduleHeaderProps } from "./types"

export const VolunteerScheduleHeader = ({}: VolunteerScheduleHeaderProps) => (
	<header className="mb-8 flex items-end justify-between gap-6 max-sm:flex-col max-sm:items-start">
		<div>
			<p className="porphyra-eyebrow">My serving</p>
			<h1 className="m-0 font-serif text-[clamp(2.5rem,5vw,4.25rem)] leading-[.98] tracking-[-.05em]">
				Upcoming schedule
			</h1>
			<p className="mt-3 max-w-152 leading-6 text-muted-foreground">
				Your assignments, with the time you need to arrive first.
			</p>
		</div>
		<Button type="button" variant="secondary">
			Availability
		</Button>
	</header>
)
