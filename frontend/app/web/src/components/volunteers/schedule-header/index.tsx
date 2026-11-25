import { Button } from "@/components/ui/button"
import { Localized, LocalizationScope } from "@/localization"
import type { VolunteerScheduleHeaderProps } from "./types"

export const VolunteerScheduleHeader = ({}: VolunteerScheduleHeaderProps) => (
	<header className="mb-8 flex items-end justify-between gap-6 max-sm:flex-col max-sm:items-start">
		<div>
			<LocalizationScope name="volunteers.schedule-header">
				<Localized asChild str="volunteers.myServing">
					<p className="porphyra-eyebrow" />
				</Localized>
				<Localized asChild str="volunteers.upcomingSchedule">
					<h1 className="m-0 font-serif text-[clamp(2.5rem,5vw,4.25rem)] leading-[.98] tracking-[-.05em]" />
				</Localized>
				<Localized asChild str="volunteers.upcomingScheduleDescription">
					<p className="mt-3 max-w-152 leading-6 text-muted-foreground" />
				</Localized>
			</LocalizationScope>
		</div>
		<Button type="button" variant="secondary">
			<LocalizationScope name="volunteers.availability-action">
				<Localized str="volunteers.availability" />
			</LocalizationScope>
		</Button>
	</header>
)
