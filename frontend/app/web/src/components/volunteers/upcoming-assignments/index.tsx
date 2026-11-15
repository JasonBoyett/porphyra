import { CalendarDays, Clock3, MapPin } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { AssignmentCardProps, UpcomingAssignmentsProps } from "./types"

const AssignmentCard = ({ assignment }: AssignmentCardProps) => {
	const hasCallTime = assignment.callTime !== undefined
	const arrivalTime = assignment.callTime ?? assignment.eventStartTime

	return (
		<Card className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-0 overflow-hidden py-0 max-sm:grid-cols-1">
			<div
				aria-label={assignment.dateLabel}
				className="flex flex-col items-center justify-center bg-muted p-5 max-sm:flex-row max-sm:justify-start max-sm:gap-2 max-sm:px-5 max-sm:py-3"
			>
				<span className="text-xs font-bold tracking-wider text-primary uppercase">
					{assignment.dayOfWeek}
				</span>
				<strong className="my-1 font-serif text-4xl leading-none max-sm:my-0 max-sm:text-xl">
					{assignment.day}
				</strong>
				<small className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
					{assignment.month}
				</small>
			</div>
			<CardContent className="min-w-0 p-5">
				<div className="flex items-start justify-between gap-4 max-sm:flex-col">
					<div>
						<p className="porphyra-eyebrow">{assignment.ministry}</p>
						<h3 className="m-0 font-serif text-3xl leading-none">{assignment.team}</h3>
					</div>
					<div
						className={`shrink-0 rounded-xl p-3 ${hasCallTime ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground max-sm:w-full"}`}
					>
						<span className="block text-xs font-bold tracking-wider uppercase">
							{hasCallTime ? "Call time" : "Event start"}
						</span>
						<strong className="mt-1 flex items-center gap-1 text-xl">
							<Clock3 aria-hidden="true" size={18} />
							{arrivalTime}
						</strong>
					</div>
				</div>
				<Separator className="my-4" />
				<div className="grid gap-2 text-sm text-muted-foreground">
					<p className="flex items-center gap-1">
						<CalendarDays aria-hidden="true" size={16} />
						<strong>{assignment.eventName}</strong>
					</p>
					<p className="flex items-center gap-1">
						<MapPin aria-hidden="true" size={16} />
						{assignment.location} · Starts {assignment.eventStartTime}
					</p>
					<p className="mt-2 leading-6">{assignment.note}</p>
				</div>
			</CardContent>
		</Card>
	)
}

export const UpcomingAssignments = ({ assignments }: UpcomingAssignmentsProps) => (
	<section aria-labelledby="upcoming-assignments" className="mt-10">
		<div className="mb-4 flex items-end justify-between">
			<div>
				<h2 className="m-0 font-serif text-3xl" id="upcoming-assignments">
					Upcoming
				</h2>
				<p className="mt-1 text-muted-foreground">
					{assignments.length} assignment{assignments.length === 1 ? "" : "s"}
				</p>
			</div>
		</div>
		{assignments.length > 0 ? (
			<div className="grid gap-4">
				{assignments.map((assignment) => (
					<AssignmentCard assignment={assignment} key={assignment.id} />
				))}
			</div>
		) : (
			<Card className="items-center border-dashed py-12 text-center">
				<h3 className="m-0 font-serif text-2xl">Nothing scheduled here</h3>
				<p className="m-0 text-muted-foreground">Try another campus or one of your ministries.</p>
			</Card>
		)}
	</section>
)
