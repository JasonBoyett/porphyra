export type Campus = {
	id: string
	label: string
}

export type VolunteerAssignment = {
	id: string
	campusId: Campus["id"]
	ministry: string
	team: string
	eventName: string
	dateLabel: string
	dayOfWeek: string
	month: string
	day: string
	location: string
	callTime?: string
	eventStartTime: string
	note: string
}
