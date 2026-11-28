import type {
	CampusAddressValue,
	CampusEditorValue,
	CampusType,
	MultiCampusEditorValue,
	RecurringServiceValue,
} from "./types"

export const CAMPUS_TYPES: readonly CampusType[] = [
	"physical",
	"online",
	"administrative",
	"ministry_center",
]

export function createDefaultService(): RecurringServiceValue {
	return {
		name: "Sunday Service",
		weekday: 6,
		startsAt: "10:00",
		durationMinutes: 60,
	}
}

export function createCampus(defaultTimeZone: string): CampusEditorValue {
	return {
		name: "",
		campusType: "physical",
		timeZone: defaultTimeZone,
		address: null,
		recurringServices: [createDefaultService()],
	}
}

export function updateCampus(
	value: MultiCampusEditorValue,
	index: number,
	update: (campus: CampusEditorValue) => CampusEditorValue,
): MultiCampusEditorValue {
	return {
		...value,
		campuses: value.campuses.map((campus, campusIndex) =>
			campusIndex === index ? update(campus) : campus,
		),
	}
}

export function addCampus(
	value: MultiCampusEditorValue,
	defaultTimeZone: string,
): MultiCampusEditorValue {
	return {
		...value,
		campuses: [...value.campuses, createCampus(defaultTimeZone)],
	}
}

export function removeCampus(value: MultiCampusEditorValue, index: number): MultiCampusEditorValue {
	const primaryCampusIndex = value.primaryCampusIndex
	let nextPrimaryCampusIndex = primaryCampusIndex

	if (primaryCampusIndex === index) {
		nextPrimaryCampusIndex = null
	} else if (primaryCampusIndex != null && primaryCampusIndex > index) {
		nextPrimaryCampusIndex = primaryCampusIndex - 1
	}

	return {
		primaryCampusIndex: nextPrimaryCampusIndex,
		campuses: value.campuses.filter((_, campusIndex) => campusIndex !== index),
	}
}

export function updateAddress(
	campus: CampusEditorValue,
	update: Partial<CampusAddressValue>,
): CampusEditorValue {
	return {
		...campus,
		address: { ...(campus.address ?? {}), ...update },
	}
}

export function updateService(
	campus: CampusEditorValue,
	index: number,
	update: Partial<RecurringServiceValue>,
): CampusEditorValue {
	const services = campus.recurringServices ?? []
	return {
		...campus,
		recurringServices: services.map((service, serviceIndex) =>
			serviceIndex === index ? { ...service, ...update } : service,
		),
	}
}

export function isValidTimeZone(timeZone: string | undefined): boolean {
	if (!timeZone?.trim()) {
		return false
	}

	try {
		new Intl.DateTimeFormat(undefined, { timeZone }).format()
		return true
	} catch {
		return false
	}
}

export function isValidMultiCampusValue(value: MultiCampusEditorValue): boolean {
	return (
		value.campuses.length >= 2 &&
		value.primaryCampusIndex !== null &&
		value.primaryCampusIndex >= 0 &&
		value.primaryCampusIndex < value.campuses.length &&
		value.campuses.every(
			(campus) =>
				campus.name.trim().length > 0 &&
				isValidTimeZone(campus.timeZone) &&
				(campus.recurringServices ?? []).every((service) => service.name.trim().length > 0),
		)
	)
}
