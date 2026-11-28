import { AlertCircle, Building2, Plus } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ComputedText, Localized, LocalizationScope } from "@/localization"
import {
	createCampus,
	isValidMultiCampusValue,
	MultiCampusEditor,
	type MultiCampusEditorValue,
} from "./multi-campus-editor"
import type { ChurchOnboardingCampus, ChurchOnboardingProps } from "./types"

const fallbackTimeZone = "America/Chicago"

export const getDeviceTimeZone = (): string => {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone
	} catch {
		return fallbackTimeZone
	}
}

const optionalValue = (value: FormDataEntryValue | null): string | null => {
	const normalized = String(value ?? "").trim()
	return normalized === "" ? null : normalized
}

const weekDays = [
	[0, "churchOnboarding.monday"],
	[1, "churchOnboarding.tuesday"],
	[2, "churchOnboarding.wednesday"],
	[3, "churchOnboarding.thursday"],
	[4, "churchOnboarding.friday"],
	[5, "churchOnboarding.saturday"],
	[6, "churchOnboarding.sunday"],
] as const

export const ChurchOnboarding = ({ isPending, onSubmit }: ChurchOnboardingProps) => {
	const [isStarted, setIsStarted] = useState(false)
	const [mode, setMode] = useState<"single" | "multiple">("single")
	const [includeAddress, setIncludeAddress] = useState(false)
	const [includeService, setIncludeService] = useState(false)
	const [timeZone] = useState(getDeviceTimeZone)
	const [multiCampusValue, setMultiCampusValue] = useState<MultiCampusEditorValue>(() => ({
		campuses: [createCampus(timeZone), createCampus(timeZone)],
		primaryCampusIndex: 0,
	}))
	const [submissionError, setSubmissionError] = useState(false)
	const [idempotencyKey] = useState(() => crypto.randomUUID())

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setSubmissionError(false)
		const form = new FormData(event.currentTarget)
		const churchName = String(form.get("churchName") ?? "").trim()

		let campuses: ChurchOnboardingCampus[] = multiCampusValue.campuses
		let primaryCampusIndex = multiCampusValue.primaryCampusIndex
		if (mode === "single") {
			const recurringServices = includeService
				? [
						{
							durationMinutes: Number(form.get("serviceDuration")) || null,
							name: String(form.get("serviceName") ?? "").trim(),
							startsAt: String(form.get("serviceTime") ?? "09:00"),
							weekday: Number(form.get("serviceWeekday") ?? 6),
						},
					]
				: []
			const address = includeAddress
				? {
						addressLine1: optionalValue(form.get("addressLine1")),
						addressLine2: optionalValue(form.get("addressLine2")),
						city: optionalValue(form.get("city")),
						countryCode: optionalValue(form.get("countryCode"))?.toUpperCase() ?? null,
						postalCode: optionalValue(form.get("postalCode")),
						region: optionalValue(form.get("region")),
					}
				: null
			campuses = [
				{
					address,
					campusType: "physical",
					name: churchName,
					recurringServices,
					timeZone: String(form.get("timeZone") ?? timeZone),
				},
			]
			primaryCampusIndex = 0
		}

		try {
			await onSubmit({
				campuses,
				idempotencyKey,
				name: churchName,
				primaryCampusIndex,
			})
		} catch {
			setSubmissionError(true)
		}
	}

	return (
		<LocalizationScope name="church-onboarding">
			<main className="mx-auto max-w-4xl px-6 py-12">
				{!isStarted ? (
					<Empty className="min-h-96 border bg-card">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Building2 />
							</EmptyMedia>
							<EmptyTitle>
								<Localized str="churchOnboarding.emptyTitle" />
							</EmptyTitle>
							<EmptyDescription>
								<Localized str="churchOnboarding.emptyDescription" />
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={() => setIsStarted(true)}>
								<Plus data-icon="inline-start" />
								<Localized str="churchOnboarding.createChurch" />
							</Button>
						</EmptyContent>
					</Empty>
				) : (
					<form onSubmit={handleSubmit}>
						<Card>
							<CardHeader>
								<CardTitle className="font-serif text-3xl">
									<Localized str="churchOnboarding.title" />
								</CardTitle>
								<CardDescription>
									<Localized str="churchOnboarding.description" />
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-8">
								<FieldGroup>
									<Field>
										<FieldLabel htmlFor="church-name">
											<Localized str="churchOnboarding.churchName" />
										</FieldLabel>
										<Input id="church-name" name="churchName" required />
									</Field>
									<FieldSet>
										<FieldLegend>
											<Localized str="churchOnboarding.structure" />
										</FieldLegend>
										<ToggleGroup
											onValueChange={(value) => {
												if (value === "single" || value === "multiple") setMode(value)
											}}
											type="single"
											value={mode}
											variant="outline"
										>
											<ToggleGroupItem value="single">
												<Localized str="churchOnboarding.singleLocation" />
											</ToggleGroupItem>
											<ToggleGroupItem value="multiple">
												<Localized str="churchOnboarding.multipleCampuses" />
											</ToggleGroupItem>
										</ToggleGroup>
									</FieldSet>
								</FieldGroup>

								{mode === "single" ? (
									<SingleCampusFields
										includeAddress={includeAddress}
										includeService={includeService}
										onAddressToggle={() => setIncludeAddress((value) => !value)}
										onServiceToggle={() => setIncludeService((value) => !value)}
										timeZone={timeZone}
									/>
								) : (
									<MultiCampusEditor
										defaultTimeZone={timeZone}
										onChange={setMultiCampusValue}
										value={multiCampusValue}
									/>
								)}

								{mode === "single" && (
									<FieldDescription>
										<Localized str="churchOnboarding.timeZoneDetected" />{" "}
										<ComputedText value={timeZone} />
									</FieldDescription>
								)}

								{submissionError && (
									<Alert variant="destructive">
										<AlertCircle />
										<AlertDescription>
											<Localized str="churchOnboarding.submitError" />
										</AlertDescription>
									</Alert>
								)}
							</CardContent>
							<CardFooter className="justify-between gap-3">
								<Button type="button" variant="ghost" onClick={() => setIsStarted(false)}>
									<Localized str="churchOnboarding.cancel" />
								</Button>
								<Button
									disabled={
										isPending || (mode === "multiple" && !isValidMultiCampusValue(multiCampusValue))
									}
									type="submit"
								>
									<Localized
										str={isPending ? "churchOnboarding.creating" : "churchOnboarding.createChurch"}
									/>
								</Button>
							</CardFooter>
						</Card>
					</form>
				)}
			</main>
		</LocalizationScope>
	)
}

type SingleCampusFieldsProps = {
	includeAddress: boolean
	includeService: boolean
	onAddressToggle: () => void
	onServiceToggle: () => void
	timeZone: string
}

const SingleCampusFields = ({
	includeAddress,
	includeService,
	onAddressToggle,
	onServiceToggle,
	timeZone,
}: SingleCampusFieldsProps) => (
	<div className="flex flex-col gap-8">
		<FieldSet>
			<FieldLegend>
				<Localized str="churchOnboarding.campusDetails" />
			</FieldLegend>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor="time-zone">
						<Localized str="churchOnboarding.timeZone" />
					</FieldLabel>
					<Input defaultValue={timeZone} id="time-zone" name="timeZone" required />
				</Field>
			</FieldGroup>
		</FieldSet>

		<OptionalAddressFields enabled={includeAddress} onToggle={onAddressToggle} />
		<OptionalServiceFields enabled={includeService} onToggle={onServiceToggle} />
	</div>
)

const OptionalAddressFields = ({
	enabled,
	onToggle,
}: {
	enabled: boolean
	onToggle: () => void
}) => (
	<FieldSet>
		<FieldLegend>
			<Localized str="churchOnboarding.address" />
		</FieldLegend>
		<FieldDescription>
			<Localized str="churchOnboarding.addressDescription" />
		</FieldDescription>
		<Button className="w-fit" onClick={onToggle} size="sm" type="button" variant="outline">
			<Localized str={enabled ? "churchOnboarding.remove" : "churchOnboarding.addAddress"} />
		</Button>
		{enabled && (
			<FieldGroup className="grid md:grid-cols-2">
				<Field className="md:col-span-2">
					<FieldLabel htmlFor="address-line-1">
						<Localized str="churchOnboarding.addressLine1" />
					</FieldLabel>
					<Input id="address-line-1" name="addressLine1" />
				</Field>
				<Field className="md:col-span-2">
					<FieldLabel htmlFor="address-line-2">
						<Localized str="churchOnboarding.addressLine2" />
					</FieldLabel>
					<Input id="address-line-2" name="addressLine2" />
				</Field>
				<Field>
					<FieldLabel htmlFor="city">
						<Localized str="churchOnboarding.city" />
					</FieldLabel>
					<Input id="city" name="city" />
				</Field>
				<Field>
					<FieldLabel htmlFor="region">
						<Localized str="churchOnboarding.region" />
					</FieldLabel>
					<Input id="region" name="region" />
				</Field>
				<Field>
					<FieldLabel htmlFor="postal-code">
						<Localized str="churchOnboarding.postalCode" />
					</FieldLabel>
					<Input id="postal-code" name="postalCode" />
				</Field>
				<Field>
					<FieldLabel htmlFor="country-code">
						<Localized str="churchOnboarding.countryCode" />
					</FieldLabel>
					<Input id="country-code" maxLength={2} name="countryCode" placeholder="US" />
				</Field>
			</FieldGroup>
		)}
	</FieldSet>
)

const OptionalServiceFields = ({
	enabled,
	onToggle,
}: {
	enabled: boolean
	onToggle: () => void
}) => (
	<FieldSet>
		<FieldLegend>
			<Localized str="churchOnboarding.weeklyService" />
		</FieldLegend>
		<FieldDescription>
			<Localized str="churchOnboarding.serviceDescription" />
		</FieldDescription>
		<Button className="w-fit" onClick={onToggle} size="sm" type="button" variant="outline">
			<Localized str={enabled ? "churchOnboarding.remove" : "churchOnboarding.addService"} />
		</Button>
		{enabled && (
			<FieldGroup className="grid md:grid-cols-2">
				<Field className="md:col-span-2">
					<FieldLabel htmlFor="service-name">
						<Localized str="churchOnboarding.serviceName" />
					</FieldLabel>
					<Input defaultValue="Sunday Worship" id="service-name" name="serviceName" required />
				</Field>
				<Field>
					<FieldLabel htmlFor="service-weekday">
						<Localized str="churchOnboarding.weekday" />
					</FieldLabel>
					<NativeSelect
						className="w-full"
						defaultValue="6"
						id="service-weekday"
						name="serviceWeekday"
					>
						{weekDays.map(([value, label]) => (
							<NativeSelectOption key={value} value={value}>
								<Localized str={label} />
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Field>
				<Field>
					<FieldLabel htmlFor="service-time">
						<Localized str="churchOnboarding.startTime" />
					</FieldLabel>
					<Input defaultValue="09:00" id="service-time" name="serviceTime" required type="time" />
				</Field>
				<Field>
					<FieldLabel htmlFor="service-duration">
						<Localized str="churchOnboarding.duration" />
					</FieldLabel>
					<Input
						defaultValue="60"
						id="service-duration"
						min="1"
						name="serviceDuration"
						type="number"
					/>
				</Field>
			</FieldGroup>
		)}
	</FieldSet>
)
