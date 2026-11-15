import { CalendarDays, Clock3 } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { TeamCard } from "@/components/planning/team-card"
import type { PlanningScheduleBoardProps, ScheduleFilter } from "./types"

const filters: readonly { id: ScheduleFilter; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "attention", label: "Needs attention" },
	{ id: "confirmed", label: "Confirmed" },
	{ id: "my-teams", label: "My teams" },
]

const formatDate = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: "full",
	}).format(new Date(value))

const formatTime = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value))

export const PlanningScheduleBoard = (props: PlanningScheduleBoardProps) => (
	<main className="mx-auto max-w-310 px-6 pt-14 pb-16 max-md:px-4 max-md:pt-10 max-md:pb-8">
		<header className="mb-8 flex items-end justify-between gap-8 max-md:flex-col max-md:items-stretch max-md:gap-4">
			<div>
				<p className="porphyra-eyebrow">Service planning</p>
				<h1 className="m-0 font-serif text-[clamp(2.35rem,5vw,4.4rem)] leading-[.98] tracking-[-.05em]">
					{props.event.title}
				</h1>
				<p className="mt-3 flex flex-wrap items-center gap-2 font-semibold text-muted-foreground">
					<CalendarDays aria-hidden="true" size={17} />
					{formatDate(props.event.startsAt)}
					<span aria-hidden="true">·</span>
					<Clock3 aria-hidden="true" size={17} />
					Event start {formatTime(props.event.startsAt)}
				</p>
			</div>
			<label className="grid min-w-[min(100%,20rem)] gap-2 text-sm font-bold">
				<span>Event</span>
				<select
					aria-label="Event"
					className="h-11 w-full rounded-md border border-input bg-card px-3 text-[.95rem] font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					onChange={(choice) => props.onSelectedEventChange(choice.target.value)}
					value={props.selectedEventId}
				>
					{props.events.map((item) => (
						<option key={item.id} value={item.id}>
							{item.title}
						</option>
					))}
				</select>
			</label>
		</header>

		<section
			aria-label="Schedule filters"
			className="porphyra-panel flex items-end justify-between gap-6 max-md:flex-col max-md:items-stretch max-md:gap-4"
		>
			<label className="grid min-w-[min(100%,20rem)] gap-2 text-sm font-bold">
				<span>Ministry</span>
				<select
					className="h-11 w-full rounded-md border border-input bg-card px-3 text-[.95rem] font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					onChange={(choice) => props.onMinistryChange(choice.target.value)}
					value={props.ministry}
				>
					<option>All ministries</option>
					{props.event.ministries.map((eventMinistry) => (
						<option key={eventMinistry.id}>{eventMinistry.name}</option>
					))}
				</select>
			</label>
			<div className="grid gap-2">
				<span className="text-sm font-bold">Show</span>
				<ToggleGroup
					aria-label="Team status"
					className="flex w-fit flex-wrap gap-2"
					onValueChange={(value: string) => value && props.onFilterChange(value as ScheduleFilter)}
					spacing={2}
					type="single"
					value={props.filter}
					variant="outline"
				>
					{filters.map((item) => (
						<ToggleGroupItem
							className="porphyra-filter-item font-bold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
							key={item.id}
							value={item.id}
						>
							{item.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
		</section>

		<p aria-live="polite" className="my-6 text-sm text-muted-foreground">
			{props.visibleTeamCount} planned {props.visibleTeamCount === 1 ? "team" : "teams"}
		</p>
		<section aria-label="Planned teams" className="grid gap-9">
			{props.teamsByMinistry.map((group) => (
				<section
					aria-labelledby={`${group.name.toLowerCase()}-heading`}
					className="grid gap-3"
					key={group.name}
				>
					<h2 className="m-0 font-serif text-3xl" id={`${group.name.toLowerCase()}-heading`}>
						{group.name}
					</h2>
					<div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
						{group.teams.map(({ team }) => (
							<TeamCard
								accessToken={props.accessToken}
								event={props.event}
								key={team.id}
								onSchedule={() => props.onSchedule(team.id)}
								team={team}
							/>
						))}
					</div>
				</section>
			))}
			{props.teamsByMinistry.length === 0 && (
				<div className="rounded-xl border border-dashed p-8 text-center">
					<h2>No teams match these filters</h2>
					<p>Try a different ministry or schedule view.</p>
				</div>
			)}
		</section>
	</main>
)
