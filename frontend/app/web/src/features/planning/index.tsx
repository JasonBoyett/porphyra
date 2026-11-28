import { useMemo, useState } from "react"

import { apiClient, type CampusEventPlanningWithActions } from "@/api/client"
import { PlanningScheduleBoard as PlanningScheduleBoardView } from "@/components/planning/planning-schedule-board"
import type { ScheduleFilter } from "@/components/planning/planning-schedule-board/types"
import { SchedulingDialog } from "@/components/planning/scheduling-dialog"
import { Localized, LocalizationScope } from "@/localization"

export const PlanningScheduleBoard = (props: {
	eventId: string
	onEventChange: (churchId: string, eventId: string) => void
}) => {
	const [ministry, setMinistry] = useState("All ministries")
	const [filter, setFilter] = useState<ScheduleFilter>("all")
	const [roleToSchedule, setRoleToSchedule] = useState<{
		replacementRequestId?: string
		roleName: string
		teamId: string
	} | null>(null)
	const events = apiClient.getCampusEvents.useQuery()

	const planning =
		apiClient.getCampusEventPlanning.useResourceQuery<CampusEventPlanningWithActions>({
			event_id: props.eventId,
		})
	const event = planning.data
	const teams = useMemo(
		() =>
			event?.ministries.flatMap((eventMinistry) =>
				eventMinistry.teams.map((team) => ({
					ministry: eventMinistry.name,
					team,
				})),
			) ?? [],
		[event?.ministries],
	)
	const visibleTeams = useMemo(
		() =>
			teams.filter(
				({ ministry: teamMinistry, team }) =>
					(ministry === "All ministries" || teamMinistry === ministry) &&
					(filter === "all" ||
						(filter === "attention" && team.confirmedAt === null) ||
						(filter === "confirmed" && team.confirmedAt !== null) ||
						(filter === "my-teams" && team.volunteers.length > 0)),
			),
		[filter, ministry, teams],
	)
	const teamsByMinistry = useMemo(
		() =>
			event?.ministries
				.map((eventMinistry) => ({
					name: eventMinistry.name,
					teams: visibleTeams.filter(
						({ ministry: teamMinistry }) => teamMinistry === eventMinistry.name,
					),
				}))
				.filter((group) => group.teams.length > 0) ?? [],
		[event?.ministries, visibleTeams],
	)
	const teamToSchedule = teams.find(({ team }) => team.id === roleToSchedule?.teamId)
	const selectEvent = (eventId: string) => {
		const selectedEvent = events.data?.find((event) => event.id === eventId)
		if (selectedEvent !== undefined) props.onEventChange(selectedEvent.churchId, eventId)
	}

	if (events.isLoading || planning.isLoading) {
		return (
			<LocalizationScope name="planning.status">
				<main className="mx-auto max-w-310 px-6 py-12">
					<Localized str="planning.loadingSchedule" />
				</main>
			</LocalizationScope>
		)
	}

	if (events.isError || planning.isError) {
		return (
			<LocalizationScope name="planning.status">
				<main className="mx-auto max-w-310 px-6 py-12 text-destructive">
					<Localized str="planning.unableToLoad" />
				</main>
			</LocalizationScope>
		)
	}

	if (event === undefined) {
		return (
			<LocalizationScope name="planning.status">
				<main className="mx-auto max-w-310 px-6 py-12">
					<Localized str="planning.noEvents" />
				</main>
			</LocalizationScope>
		)
	}

	return (
		<>
			<PlanningScheduleBoardView
				event={event}
				events={events.data ?? []}
				filter={filter}
				ministry={ministry}
				onFilterChange={setFilter}
				onMinistryChange={setMinistry}
				onSchedule={(teamId, roleName, replacementRequestId) =>
					setRoleToSchedule({ replacementRequestId, roleName, teamId })
				}
				onSelectedEventChange={selectEvent}
				selectedEventId={props.eventId}
				teamsByMinistry={teamsByMinistry}
				visibleTeamCount={visibleTeams.length}
			/>
			{roleToSchedule !== null && teamToSchedule !== undefined ? (
				<SchedulingDialog
					event={event}
					key={`${teamToSchedule.team.id}:${roleToSchedule.roleName}:${roleToSchedule.replacementRequestId ?? "assignment"}`}
					ministry={teamToSchedule.ministry}
					onClose={() => setRoleToSchedule(null)}
					roleName={roleToSchedule.roleName}
					replacementRequestId={roleToSchedule.replacementRequestId}
					team={teamToSchedule.team}
				/>
			) : null}
		</>
	)
}

export default PlanningScheduleBoard
