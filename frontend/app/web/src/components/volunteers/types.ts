export type Campus = {
	id: string
	label: string
}

export type VolunteerAssignment = {
	id: string
	campusId: Campus["id"]
	ministry: string
	team: string
	roleName?: string
	eventName: string
	eventStartsAt: string
	dateLabel: string
	dayOfWeek: string
	month: string
	day: string
	location: string
	mapUrl: string
	callTime?: string
	eventStartTime: string
	note?: string
	cancel?: () => Promise<unknown>
}
