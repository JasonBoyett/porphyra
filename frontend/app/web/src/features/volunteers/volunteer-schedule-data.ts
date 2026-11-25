import type { MyVolunteerAssignmentResponse } from "@porphyra/frontend/api/types"

import type { VolunteerAssignmentWithActions } from "@/api/client"
import type { Campus, VolunteerAssignment } from "@/components/volunteers/types"

const formatDatePart = (value: Date, timeZone: string, options: Intl.DateTimeFormatOptions) =>
	new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(value)

const campusAddress = (assignment: MyVolunteerAssignmentResponse) => {
	const { addressLine1, addressLine2, city, countryCode, postalCode, region } =
		assignment.campusLocation
	return [addressLine1, addressLine2, `${city}, ${region} ${postalCode}`, countryCode]
		.filter((part): part is string => part !== null && part.length > 0)
		.join(", ")
}

export type VolunteerScheduleData = {
	campuses: Campus[]
	ministries: string[]
	assignments: VolunteerAssignment[]
}

const toVolunteerAssignment = (
	assignment: MyVolunteerAssignmentResponse & Partial<VolunteerAssignmentWithActions>,
): VolunteerAssignment => {
	const eventStartsAt = new Date(assignment.eventStartsAt)
	const timeZone = assignment.campusLocation.timeZone
	const address = campusAddress(assignment)
	return {
		id: assignment.id,
		campusId: assignment.campusId,
		ministry: assignment.ministryName,
		team: assignment.teamName,
		roleName: assignment.roleName ?? undefined,
		eventName: assignment.eventTitle,
		eventStartsAt: assignment.eventStartsAt,
		dateLabel: formatDatePart(eventStartsAt, timeZone, { dateStyle: "full" }),
		dayOfWeek: formatDatePart(eventStartsAt, timeZone, { weekday: "short" }),
		month: formatDatePart(eventStartsAt, timeZone, { month: "short" }),
		day: formatDatePart(eventStartsAt, timeZone, { day: "numeric" }),
		location: assignment.campusName,
		mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
		callTime:
			assignment.callTime === null
				? undefined
				: formatDatePart(new Date(assignment.callTime), timeZone, {
						hour: "numeric",
						minute: "2-digit",
					}),
		eventStartTime: formatDatePart(eventStartsAt, timeZone, {
			hour: "numeric",
			minute: "2-digit",
		}),
		note: assignment.notes.join(" ") || undefined,
		cancel: assignment.cancel,
	}
}

export const toVolunteerScheduleData = (
	assignments: readonly (MyVolunteerAssignmentResponse & Partial<VolunteerAssignmentWithActions>)[],
): VolunteerScheduleData => {
	const campuses = new Map<string, Campus>()
	for (const assignment of assignments) {
		campuses.set(assignment.campusId, {
			id: assignment.campusId,
			label: assignment.campusName,
		})
	}
	return {
		campuses: [...campuses.values()],
		ministries: [...new Set(assignments.map((assignment) => assignment.ministryName))],
		assignments: assignments.map(toVolunteerAssignment),
	}
}
