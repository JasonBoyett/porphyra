import { useState } from "react"
import { CalendarDays, Clock3, Ellipsis, MapPin } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useSimpleLocalizedString } from "@/localization"
import type { AssignmentCardProps, UpcomingAssignmentsProps } from "./types"

const AssignmentCard = ({ assignment }: AssignmentCardProps) => {
	const [isCancelling, setIsCancelling] = useState(false)
	const hasCallTime = assignment.callTime !== undefined
	const arrivalTime = assignment.callTime ?? assignment.eventStartTime
	const callTimeLabel = useSimpleLocalizedString("volunteers.callTime")
	const eventStartsAtLabel = useSimpleLocalizedString("volunteers.eventStartsAt")
	const assignmentActionsLabel = useSimpleLocalizedString("volunteers.assignmentActions")
	const cancelAssignmentLabel = useSimpleLocalizedString("volunteers.cancelAssignment")
	const cancelAssignmentFailed = useSimpleLocalizedString("volunteers.cancelAssignmentFailed")
	const timingDescription = useSimpleLocalizedString(
		hasCallTime ? "volunteers.assignmentArrivalTiming" : "volunteers.assignmentTiming",
		hasCallTime
			? {
					eventName: assignment.eventName,
					eventStartTime: assignment.eventStartTime,
					callTime: arrivalTime,
				}
			: {
					eventName: assignment.eventName,
					eventStartTime: assignment.eventStartTime,
				},
	)
	const cancelAssignment = async () => {
		if (assignment.cancel === undefined) return
		setIsCancelling(true)
		try {
			await assignment.cancel()
		} catch {
			toast.error(cancelAssignmentFailed)
			setIsCancelling(false)
		}
	}

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
					<div className="min-w-0">
						<p className="porphyra-eyebrow">{assignment.ministry}</p>
						<div className="flex items-center gap-1">
							<h3 className="m-0 font-serif text-3xl leading-none">
								{assignment.roleName ?? assignment.team}
							</h3>
							{assignment.cancel !== undefined && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											aria-label={assignmentActionsLabel}
											disabled={isCancelling}
											size="icon-xs"
											variant="ghost"
										>
											<Ellipsis data-icon="inline-start" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										<DropdownMenuGroup>
											<DropdownMenuItem
												disabled={isCancelling}
												onSelect={() => void cancelAssignment()}
												variant="destructive"
											>
												{cancelAssignmentLabel}
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
						{assignment.roleName !== undefined && (
							<p className="mt-1 text-sm text-muted-foreground">{assignment.team}</p>
						)}
					</div>
					<div
						className={`shrink-0 rounded-xl p-3 ${hasCallTime ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground max-sm:w-full"}`}
					>
						<span className="block text-xs font-bold tracking-wider uppercase">
							{hasCallTime ? callTimeLabel : eventStartsAtLabel}
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
					<a
						className="flex w-fit items-center gap-1 hover:text-foreground hover:underline"
						href={assignment.mapUrl}
						rel="noreferrer"
						target="_blank"
					>
						<MapPin aria-hidden="true" size={16} />
						{assignment.location} · {timingDescription}
					</a>
					{assignment.note !== undefined && <p className="mt-2 leading-6">{assignment.note}</p>}
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
