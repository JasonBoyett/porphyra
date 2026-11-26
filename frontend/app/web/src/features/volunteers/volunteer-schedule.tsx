import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { type VolunteerAssignmentWithActions, type VolunteerRequestWithActions } from "@/api/client"
import { useAuth } from "@/auth"
import { ScheduleFilters } from "@/components/volunteers/schedule-filters"
import { RequestInbox } from "@/components/volunteers/request-inbox"
import { VolunteerScheduleHeader } from "@/components/volunteers/schedule-header"
import { UpcomingAssignments } from "@/components/volunteers/upcoming-assignments"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComputedText, Localized, LocalizationScope } from "@/localization"
import { toVolunteerScheduleData } from "./volunteer-schedule-data"

const allCampuses = "all-campuses"
const allMinistries = "all-ministries"

/** A self-contained volunteer schedule view ready to mount in the web App. */
export const VolunteerSchedule = () => {
	const auth = useAuth()
	const router = useRouter()
	const { apiClient } = router.options.context
	const [campusId, setCampusId] = useState(allCampuses)
	const [ministry, setMinistry] = useState(allMinistries)
	const accessToken = auth.session?.accessToken ?? ""
	const scheduleQuery = apiClient.getMyVolunteerAssignments.useResourceQuery({
		enabled: accessToken !== "",
	})
	const requests = apiClient.getMyVolunteerRequests.useResourceQuery(
		{},
		{ enabled: accessToken !== "" },
	)

	const schedule = toVolunteerScheduleData(
		(scheduleQuery.data?.assignments ?? []) as VolunteerAssignmentWithActions[],
	)
	const assignments = schedule.assignments.filter(
		(assignment) =>
			new Date(assignment.eventStartsAt) >= new Date() &&
			(campusId === allCampuses || assignment.campusId === campusId) &&
			(ministry === allMinistries || assignment.ministry === ministry),
	)

	return (
		<main className="mx-auto max-w-260 px-6 py-12 pb-16 max-md:px-4 max-md:py-8">
			<VolunteerScheduleHeader />
			<Tabs className="mt-8" defaultValue="schedule">
				<TabsList>
					<TabsTrigger value="schedule">
						<LocalizationScope name="volunteers.schedule-tab">
							<Localized str="volunteers.mySchedule" />
						</LocalizationScope>
					</TabsTrigger>
					<TabsTrigger value="requests">
						<LocalizationScope name="volunteers.requests-tab">
							<Localized str="volunteers.requests" />
						</LocalizationScope>
						{(requests.data ?? []).length > 0 && (
							<span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
								<ComputedText value={requests.data?.length ?? 0} />
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
					<RequestInbox
						accessToken={accessToken}
						requests={(requests.data ?? []) as VolunteerRequestWithActions[]}
					/>
				</TabsContent>
			</Tabs>
		</main>
	)
}
