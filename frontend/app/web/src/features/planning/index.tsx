import { useEffect, useMemo, useState } from "react"

import { apiClient } from "@/api/client"
import { PlanningScheduleBoard as PlanningScheduleBoardView } from "@/components/planning/planning-schedule-board"
import type { ScheduleFilter } from "@/components/planning/planning-schedule-board/types"
import { SchedulingDialog } from "@/components/planning/scheduling-dialog"

export const PlanningScheduleBoard = (props: { accessToken: string }) => {
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
	const [ministry, setMinistry] = useState("All ministries")
	const [filter, setFilter] = useState<ScheduleFilter>("all")
	const [teamToScheduleId, setTeamToScheduleId] = useState<string | null>(null)
	const events = apiClient.campusEvents.useSyncQuery({ accessToken: props.accessToken })

	useEffect(() => {
		if (selectedEventId === null && events.data?.[0] !== undefined) {
			setSelectedEventId(events.data[0].id)
		}
	}, [events.data, selectedEventId])

	const planning = apiClient.campusEventPlanning.useSyncQuery(
		{ accessToken: props.accessToken, eventId: selectedEventId ?? "" },
		{ enabled: selectedEventId !== null },
	)
	const event = planning.data
	const teams =
		event?.ministries.flatMap((eventMinistry) =>
			eventMinistry.teams.map((team) => ({
				ministry: eventMinistry.name,
				team,
			})),
		) ?? []
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
	const teamToSchedule = teams.find(({ team }) => team.id === teamToScheduleId)

	if (events.isLoading || planning.isLoading) {
		return <main className="mx-auto max-w-310 px-6 py-12">Loading schedule…</main>
	}

	if (events.isError || planning.isError) {
		return (
			<main className="mx-auto max-w-310 px-6 py-12 text-destructive">
				Unable to load this schedule. Please try again.
			</main>
		)
	}

	if (event === undefined) {
		return (
			<main className="mx-auto max-w-310 px-6 py-12">No events are available to plan yet.</main>
		)
	}

	return (
		<>
			<PlanningScheduleBoardView
				accessToken={props.accessToken}
				event={event}
				events={events.data ?? []}
				filter={filter}
				ministry={ministry}
				onFilterChange={setFilter}
				onMinistryChange={setMinistry}
				onSchedule={setTeamToScheduleId}
				onSelectedEventChange={setSelectedEventId}
				selectedEventId={selectedEventId ?? ""}
				teamsByMinistry={teamsByMinistry}
				visibleTeamCount={visibleTeams.length}
			/>
			<SchedulingDialog
				accessToken={props.accessToken}
				event={event}
				ministry={teamToSchedule?.ministry}
				onClose={() => setTeamToScheduleId(null)}
				team={teamToSchedule?.team}
			/>
		</>
	)
}

export default PlanningScheduleBoard
