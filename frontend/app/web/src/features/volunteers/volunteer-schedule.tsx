import { useMemo, useState } from "react"
import { apiClient } from "@/api/client"
import { useAuth } from "@/auth"
import { ScheduleFilters } from "@/components/volunteers/schedule-filters"
import { RequestInbox } from "@/components/volunteers/request-inbox"
import { VolunteerScheduleHeader } from "@/components/volunteers/schedule-header"
import { UpcomingAssignments } from "@/components/volunteers/upcoming-assignments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Campus, VolunteerAssignment } from "@/components/volunteers/types"

const allCampuses = "all-campuses"
const allMinistries = "all-ministries"

// Local, presentation-focused seed data until this feature receives its schedule API adapter.
const schedule = {
	campuses: [
		{ id: "downtown", label: "Grace Harbor Church — Downtown" },
	] satisfies readonly Campus[],
	ministries: ["Music", "Kids"],
	assignments: [
		{
			id: "sunday-worship-band",
			campusId: "downtown",
			ministry: "Music",
			team: "Band",
			eventName: "Sunday Worship Service",
			dateLabel: "Sunday, November 15",
			dayOfWeek: "SUN",
			month: "NOV",
			day: "15",
			location: "Downtown",
			callTime: "7:30 AM",
			eventStartTime: "9:00 AM",
			note: "Meet in the green room for soundcheck.",
		},
		{
			id: "sunday-worship-fourth-grade",
			campusId: "downtown",
			ministry: "Kids",
			team: "Fourth Grade",
			eventName: "Sunday Worship Service",
			dateLabel: "Sunday, November 15",
			dayOfWeek: "SUN",
			month: "NOV",
			day: "15",
			location: "Downtown",
			eventStartTime: "9:00 AM",
			note: "Review the lesson and prepare activity supplies.",
		},
	] satisfies readonly VolunteerAssignment[],
}

/** A self-contained volunteer schedule view ready to mount in the web App. */
export const VolunteerSchedule = () => {
	const auth = useAuth()
	const [campusId, setCampusId] = useState(allCampuses)
	const [ministry, setMinistry] = useState(allMinistries)
	const accessToken = auth.session?.accessToken ?? ""
	const requests = apiClient.myVolunteerRequests.useSyncQuery(
		{ accessToken },
		{ enabled: accessToken !== "" },
	)

	const assignments = useMemo(
		() =>
			schedule.assignments.filter(
				(assignment) =>
					(campusId === allCampuses || assignment.campusId === campusId) &&
					(ministry === allMinistries || assignment.ministry === ministry),
			),
		[campusId, ministry],
	)

	return (
		<main className="mx-auto max-w-260 px-6 py-12 pb-16 max-md:px-4 max-md:py-8">
			<VolunteerScheduleHeader />
			<Tabs className="mt-8" defaultValue="schedule">
				<TabsList>
					<TabsTrigger value="schedule">My schedule</TabsTrigger>
					<TabsTrigger value="requests">
						Requests
						{(requests.data ?? []).length > 0 && (
							<span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
								{requests.data?.length}
							</span>
						)}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="schedule">
					<ScheduleFilters
						campuses={schedule.campuses}
						campusId={campusId}
						ministries={schedule.ministries}
						ministry={ministry}
						onCampusChange={setCampusId}
						onMinistryChange={setMinistry}
					/>
					<UpcomingAssignments assignments={assignments} />
				</TabsContent>
				<TabsContent className="mt-6" value="requests">
					<RequestInbox accessToken={accessToken} requests={requests.data ?? []} />
				</TabsContent>
			</Tabs>
		</main>
	)
}
