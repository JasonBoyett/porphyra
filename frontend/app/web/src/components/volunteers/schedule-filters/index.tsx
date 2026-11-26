import { Card, CardContent } from "@/components/ui/card"
import { Localized, LocalizationScope } from "@/localization"
import type { ScheduleFiltersProps } from "./types"

const allCampuses = "all-campuses"
const allMinistries = "all-ministries"

export const ScheduleFilters = ({
	campuses,
	campusId,
	ministries,
	ministry,
	onCampusChange,
	onMinistryChange,
}: ScheduleFiltersProps) => (
	<Card aria-label="Schedule filters" className="py-0">
		<CardContent className="grid grid-cols-2 gap-4 p-5 max-sm:grid-cols-1">
			<label className="grid gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
				<LocalizationScope name="volunteers.campus-filter-label">
					<Localized asChild str="volunteers.campus">
						<span />
					</Localized>
				</LocalizationScope>
				<select
					className="h-12 w-full rounded-md border border-input bg-background px-3 text-base font-bold normal-case outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
					onChange={(event) => onCampusChange(event.target.value)}
					value={campusId}
				>
					<LocalizationScope name="volunteers.all-campuses-option">
						<Localized asChild str="volunteers.allCampuses">
							<option value={allCampuses} />
						</Localized>
					</LocalizationScope>
					{campuses.map((campus) => (
						<option data-localization-kind="computed" key={campus.id} value={campus.id}>
							{campus.label}
						</option>
					))}
				</select>
			</label>
			<label className="grid gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
				<LocalizationScope name="volunteers.ministry-filter-label">
					<Localized asChild str="volunteers.myMinistries">
						<span />
					</Localized>
				</LocalizationScope>
				<select
					className="h-12 w-full rounded-md border border-input bg-background px-3 text-base font-bold normal-case outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
					onChange={(event) => onMinistryChange(event.target.value)}
					value={ministry}
				>
					<LocalizationScope name="volunteers.all-my-ministries-option">
						<Localized asChild str="volunteers.allMyMinistries">
							<option value={allMinistries} />
						</Localized>
					</LocalizationScope>
					{ministries.map((item) => (
						<option data-localization-kind="computed" key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</label>
		</CardContent>
	</Card>
)
