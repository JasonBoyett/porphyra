import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { useTranslation } from "@/localization"

import { CampusEditorCard } from "./campus-editor-card"
import {
	addCampus,
	createCampus,
	isValidMultiCampusValue,
	removeCampus,
	updateCampus,
} from "./model"
import type { MultiCampusEditorProps, MultiCampusEditorText } from "./types"

export function MultiCampusEditor({
	value,
	onChange,
	defaultTimeZone,
	idPrefix = "multi-campus-editor",
	text: textOverrides,
}: MultiCampusEditorProps) {
	const translation = useTranslation()
	const defaultText: MultiCampusEditorText = {
		title: translation.resolveShared("churchOnboarding.multi.title"),
		description: translation.resolveShared("churchOnboarding.multi.description"),
		addCampus: translation.resolveShared("churchOnboarding.multi.addCampus"),
		removeCampus: translation.resolveShared("churchOnboarding.multi.removeCampus"),
		campusNumber: (number) =>
			translation.resolveShared("churchOnboarding.multi.campusNumber", { number }),
		campusName: translation.resolveShared("churchOnboarding.campusName"),
		campusNamePlaceholder: translation.resolveShared(
			"churchOnboarding.multi.campusNamePlaceholder",
		),
		campusType: translation.resolveShared("churchOnboarding.multi.campusType"),
		campusTypeDescription: translation.resolveShared(
			"churchOnboarding.multi.campusTypeDescription",
		),
		campusTypeLabels: {
			physical: translation.resolveShared("churchOnboarding.multi.physical"),
			online: translation.resolveShared("churchOnboarding.multi.online"),
			administrative: translation.resolveShared("churchOnboarding.multi.administrative"),
			ministry_center: translation.resolveShared("churchOnboarding.multi.ministryCenter"),
		},
		timeZone: translation.resolveShared("churchOnboarding.timeZone"),
		timeZoneDescription: translation.resolveShared("churchOnboarding.multi.timeZoneDescription"),
		primaryCampus: translation.resolveShared("churchOnboarding.multi.primaryCampus"),
		makePrimary: translation.resolveShared("churchOnboarding.multi.makePrimary"),
		primaryDescription: translation.resolveShared("churchOnboarding.multi.primaryDescription"),
		address: translation.resolveShared("churchOnboarding.address"),
		addAddress: translation.resolveShared("churchOnboarding.addAddress"),
		removeAddress: translation.resolveShared("churchOnboarding.multi.removeAddress"),
		addressLine1: translation.resolveShared("churchOnboarding.addressLine1"),
		addressLine2: translation.resolveShared("churchOnboarding.addressLine2"),
		city: translation.resolveShared("churchOnboarding.city"),
		region: translation.resolveShared("churchOnboarding.region"),
		postalCode: translation.resolveShared("churchOnboarding.postalCode"),
		countryCode: translation.resolveShared("churchOnboarding.countryCode"),
		countryCodeDescription: translation.resolveShared(
			"churchOnboarding.multi.countryCodeDescription",
		),
		weeklyServices: translation.resolveShared("churchOnboarding.multi.weeklyServices"),
		weeklyServicesDescription: translation.resolveShared(
			"churchOnboarding.multi.weeklyServicesDescription",
		),
		addWeeklyService: translation.resolveShared("churchOnboarding.addService"),
		noServices: translation.resolveShared("churchOnboarding.multi.noServices"),
		serviceNumber: (number) =>
			translation.resolveShared("churchOnboarding.multi.serviceNumber", { number }),
		removeService: translation.resolveShared("churchOnboarding.multi.removeService"),
		serviceName: translation.resolveShared("churchOnboarding.serviceName"),
		weekday: translation.resolveShared("churchOnboarding.weekday"),
		weekdayLabels: [
			translation.resolveShared("churchOnboarding.monday"),
			translation.resolveShared("churchOnboarding.tuesday"),
			translation.resolveShared("churchOnboarding.wednesday"),
			translation.resolveShared("churchOnboarding.thursday"),
			translation.resolveShared("churchOnboarding.friday"),
			translation.resolveShared("churchOnboarding.saturday"),
			translation.resolveShared("churchOnboarding.sunday"),
		],
		startTime: translation.resolveShared("churchOnboarding.startTime"),
		durationMinutes: translation.resolveShared("churchOnboarding.duration"),
		minimumCampusesError: translation.resolveShared("churchOnboarding.multi.minimumCampusesError"),
		nameRequiredError: translation.resolveShared("churchOnboarding.multi.nameRequiredError"),
		typeRequiredError: translation.resolveShared("churchOnboarding.multi.typeRequiredError"),
		timeZoneRequiredError: translation.resolveShared(
			"churchOnboarding.multi.timeZoneRequiredError",
		),
		invalidTimeZoneError: translation.resolveShared("churchOnboarding.multi.invalidTimeZoneError"),
		primaryRequiredError: translation.resolveShared("churchOnboarding.multi.primaryRequiredError"),
		serviceNameRequiredError: translation.resolveShared(
			"churchOnboarding.multi.serviceNameRequiredError",
		),
	}
	const text = { ...defaultText, ...textOverrides }
	const hasMinimumCampuses = value.campuses.length >= 2
	const hasValidPrimaryCampus =
		value.primaryCampusIndex != null &&
		value.primaryCampusIndex >= 0 &&
		value.primaryCampusIndex < value.campuses.length

	return (
		<section aria-labelledby={`${idPrefix}-title`} className="flex flex-col gap-6">
			<header className="flex flex-col gap-1">
				<h2 id={`${idPrefix}-title`} className="text-xl font-semibold">
					{text.title}
				</h2>
				<p className="text-sm text-muted-foreground">{text.description}</p>
			</header>

			{!hasMinimumCampuses && <FieldError>{text.minimumCampusesError}</FieldError>}
			{!hasValidPrimaryCampus && value.campuses.length > 0 && (
				<FieldError>{text.primaryRequiredError}</FieldError>
			)}

			<div className="flex flex-col gap-6">
				{value.campuses.map((campus, index) => (
					<CampusEditorCard
						key={index}
						campus={campus}
						index={index}
						isPrimary={value.primaryCampusIndex === index}
						canRemove={value.campuses.length > 2}
						idPrefix={idPrefix}
						text={text}
						onChange={(nextCampus) => onChange(updateCampus(value, index, () => nextCampus))}
						onMakePrimary={() => onChange({ ...value, primaryCampusIndex: index })}
						onRemove={() => onChange(removeCampus(value, index))}
					/>
				))}
			</div>

			<Button
				type="button"
				variant="outline"
				className="w-fit"
				onClick={() => onChange(addCampus(value, defaultTimeZone))}
			>
				<Plus data-icon="inline-start" />
				{text.addCampus}
			</Button>
		</section>
	)
}

export type {
	CampusAddressValue,
	CampusEditorValue,
	CampusType,
	MultiCampusEditorProps,
	MultiCampusEditorText,
	MultiCampusEditorValue,
	RecurringServiceValue,
} from "./types"

export { createCampus, isValidMultiCampusValue }
