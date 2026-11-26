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
import {
	ComputedText,
	Localized,
	LocalizationScope,
	useSimpleLocalizedString,
} from "@/localization"
import type { AssignmentCardProps, UpcomingAssignmentsProps } from "./types"

const AssignmentCard = ({ assignment }: AssignmentCardProps) => {
	const [isCancelling, setIsCancelling] = useState(false)
	const hasCallTime = assignment.callTime !== undefined
	const arrivalTime = assignment.callTime ?? assignment.eventStartTime
	const assignmentActionsLabel = useSimpleLocalizedString("volunteers.assignmentActions")
	const cancelAssignmentFailed = useSimpleLocalizedString("volunteers.cancelAssignmentFailed")
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
		<LocalizationScope name="volunteers.assignment-card">
			<Card className="grid grid-cols-[7.25rem_minmax(0,1fr)] gap-0 overflow-hidden py-0 max-sm:grid-cols-1">
				<div
					aria-label={assignment.dateLabel}
					className="flex flex-col items-center justify-center bg-muted p-5 max-sm:flex-row max-sm:justify-start max-sm:gap-2 max-sm:px-5 max-sm:py-3"
				>
					<span className="text-xs font-bold tracking-wider text-primary uppercase">
						<ComputedText value={assignment.dayOfWeek} />
					</span>
					<strong className="my-1 font-serif text-4xl leading-none max-sm:my-0 max-sm:text-xl">
						<ComputedText value={assignment.day} />
					</strong>
					<small className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
						<ComputedText value={assignment.month} />
					</small>
				</div>
				<CardContent className="min-w-0 p-5">
					<div className="flex items-start justify-between gap-4 max-sm:flex-col">
						<div className="min-w-0">
							<p className="porphyra-eyebrow">
								<ComputedText value={assignment.ministry} />
							</p>
							<div className="flex items-center gap-1">
								<h3 className="m-0 font-serif text-3xl leading-none">
									<ComputedText value={assignment.roleName ?? assignment.team} />
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
													<Localized str="volunteers.cancelAssignment" />
												</DropdownMenuItem>
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
							{assignment.roleName !== undefined && (
								<p className="mt-1 text-sm text-muted-foreground">
									<ComputedText value={assignment.team} />
								</p>
							)}
						</div>
						<div
							className={`shrink-0 rounded-xl p-3 ${hasCallTime ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground max-sm:w-full"}`}
						>
							<span className="block text-xs font-bold tracking-wider uppercase">
								<LocalizationScope name="volunteers.assignment-arrival-label">
									<Localized
										str={hasCallTime ? "volunteers.callTime" : "volunteers.eventStartsAt"}
									/>
								</LocalizationScope>
							</span>
							<strong className="mt-1 flex items-center gap-1 text-xl">
								<Clock3 aria-hidden="true" size={18} />
								<ComputedText value={arrivalTime} />
							</strong>
						</div>
					</div>
					<Separator className="my-4" />
					<div className="grid gap-2 text-sm text-muted-foreground">
						<p className="flex items-center gap-1">
							<CalendarDays aria-hidden="true" size={16} />
							<strong>
								<ComputedText value={assignment.eventName} />
							</strong>
						</p>
						<a
							className="flex w-fit items-center gap-1 hover:text-foreground hover:underline"
							href={assignment.mapUrl}
							rel="noreferrer"
							target="_blank"
						>
							<MapPin aria-hidden="true" size={16} />
							<ComputedText value={`${assignment.location} ·`} />{" "}
							<LocalizationScope name="volunteers.assignment-timing">
								<ComputedText value={assignment.eventName} />{" "}
								<Localized str="volunteers.assignmentStartsAt" />{" "}
								<ComputedText value={`${assignment.eventStartTime}.`} />
								{hasCallTime && (
									<>
										{" "}
										<Localized str="volunteers.pleaseArriveAt" />{" "}
										<ComputedText value={`${arrivalTime}.`} />
									</>
								)}
							</LocalizationScope>
						</a>
						{assignment.note !== undefined && (
							<p className="mt-2 leading-6">
								<ComputedText value={assignment.note} />
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</LocalizationScope>
	)
}

export const UpcomingAssignments = ({ assignments }: UpcomingAssignmentsProps) => (
	<section aria-labelledby="upcoming-assignments" className="mt-10">
		<div className="mb-4 flex items-end justify-between">
			<div>
				<LocalizationScope name="volunteers.upcoming-assignments">
					<Localized asChild str="volunteers.upcoming">
						<h2 className="m-0 font-serif text-3xl" id="upcoming-assignments" />
					</Localized>
					<p className="mt-1 text-muted-foreground">
						<ComputedText value={assignments.length} />{" "}
						<Localized
							str={assignments.length === 1 ? "volunteers.assignment" : "volunteers.assignments"}
						/>
					</p>
				</LocalizationScope>
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
				<LocalizationScope name="volunteers.empty-assignments">
					<Localized asChild str="volunteers.noAssignments">
						<h3 className="m-0 font-serif text-2xl" />
					</Localized>
					<Localized asChild str="volunteers.noAssignmentsDescription">
						<p className="m-0 text-muted-foreground" />
					</Localized>
				</LocalizationScope>
			</Card>
		)}
	</section>
)
