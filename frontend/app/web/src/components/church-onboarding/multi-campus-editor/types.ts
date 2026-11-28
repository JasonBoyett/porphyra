import type { ApiOperationInput } from "@porphyra/frontend/api/types"

type CreateChurchInput = ApiOperationInput<"createChurch">

export type CampusEditorValue = CreateChurchInput["campuses"][number]
export type CampusType = CampusEditorValue["campusType"]
export type CampusAddressValue = NonNullable<CampusEditorValue["address"]>
export type RecurringServiceValue = NonNullable<CampusEditorValue["recurringServices"]>[number]

export type MultiCampusEditorValue = {
	primaryCampusIndex: CreateChurchInput["primaryCampusIndex"]
	campuses: CreateChurchInput["campuses"]
}

export type MultiCampusEditorText = {
	title: string
	description: string
	addCampus: string
	removeCampus: string
	campusNumber: (number: number) => string
	campusName: string
	campusNamePlaceholder: string
	campusType: string
	campusTypeDescription: string
	campusTypeLabels: Record<CampusType, string>
	timeZone: string
	timeZoneDescription: string
	primaryCampus: string
	makePrimary: string
	primaryDescription: string
	address: string
	addAddress: string
	removeAddress: string
	addressLine1: string
	addressLine2: string
	city: string
	region: string
	postalCode: string
	countryCode: string
	countryCodeDescription: string
	weeklyServices: string
	weeklyServicesDescription: string
	addWeeklyService: string
	noServices: string
	serviceNumber: (number: number) => string
	removeService: string
	serviceName: string
	weekday: string
	weekdayLabels: readonly string[]
	startTime: string
	durationMinutes: string
	minimumCampusesError: string
	nameRequiredError: string
	typeRequiredError: string
	timeZoneRequiredError: string
	invalidTimeZoneError: string
	primaryRequiredError: string
	serviceNameRequiredError: string
}

export type MultiCampusEditorProps = {
	value: MultiCampusEditorValue
	onChange: (value: MultiCampusEditorValue) => void
	defaultTimeZone: string
	idPrefix?: string
	text?: Partial<MultiCampusEditorText>
}
