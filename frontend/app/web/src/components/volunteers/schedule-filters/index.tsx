import { Card, CardContent } from "@/components/ui/card"
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
				<span>Campus</span>
				<select
					className="h-12 w-full rounded-md border border-input bg-background px-3 text-base font-bold normal-case outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
					onChange={(event) => onCampusChange(event.target.value)}
					value={campusId}
				>
					<option value={allCampuses}>All campuses</option>
					{campuses.map((campus) => (
						<option key={campus.id} value={campus.id}>
							{campus.label}
						</option>
					))}
				</select>
			</label>
			<label className="grid gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
				<span>My ministries</span>
				<select
					className="h-12 w-full rounded-md border border-input bg-background px-3 text-base font-bold normal-case outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
					onChange={(event) => onMinistryChange(event.target.value)}
					value={ministry}
				>
					<option value={allMinistries}>All my ministries</option>
					{ministries.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</label>
		</CardContent>
	</Card>
)
