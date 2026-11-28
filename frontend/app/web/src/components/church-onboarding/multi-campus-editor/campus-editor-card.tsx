import { Plus, Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
	CAMPUS_TYPES,
	createDefaultService,
	isValidTimeZone,
	updateAddress,
	updateService,
} from "./model"
import type { CampusEditorValue, CampusType, MultiCampusEditorText } from "./types"

type CampusEditorCardProps = {
	campus: CampusEditorValue
	index: number
	isPrimary: boolean
	canRemove: boolean
	idPrefix: string
	text: MultiCampusEditorText
	onChange: (campus: CampusEditorValue) => void
	onMakePrimary: () => void
	onRemove: () => void
}

export function CampusEditorCard({
	campus,
	index,
	isPrimary,
	canRemove,
	idPrefix,
	text,
	onChange,
	onMakePrimary,
	onRemove,
}: CampusEditorCardProps) {
	const campusId = `${idPrefix}-campus-${index}`
	const nameIsInvalid = campus.name.trim().length === 0
	const typeIsInvalid = campus.campusType == null
	const timeZoneIsInvalid = !isValidTimeZone(campus.timeZone)
	const services = campus.recurringServices
	const shouldOfferServiceChoice =
		campus.campusType === "physical" || campus.campusType === "online"

	return (
		<Card aria-labelledby={`${campusId}-title`}>
			<CardHeader>
				<CardTitle id={`${campusId}-title`}>{text.campusNumber(index + 1)}</CardTitle>
				<CardDescription>
					{isPrimary ? text.primaryCampus : text.primaryDescription}
				</CardDescription>
				<CardAction>
					<Button
						type="button"
						variant={isPrimary ? "secondary" : "outline"}
						size="sm"
						aria-pressed={isPrimary}
						onClick={onMakePrimary}
					>
						<Star data-icon="inline-start" />
						{isPrimary ? text.primaryCampus : text.makePrimary}
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent>
				<FieldGroup>
					<Field data-invalid={nameIsInvalid}>
						<FieldLabel htmlFor={`${campusId}-name`}>{text.campusName}</FieldLabel>
						<Input
							id={`${campusId}-name`}
							value={campus.name}
							placeholder={text.campusNamePlaceholder}
							aria-invalid={nameIsInvalid}
							aria-describedby={nameIsInvalid ? `${campusId}-name-error` : undefined}
							onChange={(event) => onChange({ ...campus, name: event.target.value })}
						/>
						{nameIsInvalid && (
							<FieldError id={`${campusId}-name-error`}>{text.nameRequiredError}</FieldError>
						)}
					</Field>

					<FieldSet data-invalid={typeIsInvalid}>
						<FieldLegend variant="label">{text.campusType}</FieldLegend>
						<FieldDescription>{text.campusTypeDescription}</FieldDescription>
						<ToggleGroup
							type="single"
							variant="outline"
							value={campus.campusType ?? ""}
							aria-label={text.campusType}
							aria-invalid={typeIsInvalid}
							aria-describedby={typeIsInvalid ? `${campusId}-type-error` : undefined}
							className="flex-wrap justify-start"
							onValueChange={(campusType) => {
								if (campusType) {
									onChange({ ...campus, campusType: campusType as CampusType })
								}
							}}
						>
							{CAMPUS_TYPES.map((campusType) => (
								<ToggleGroupItem key={campusType} value={campusType}>
									{text.campusTypeLabels[campusType]}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
						{typeIsInvalid && (
							<FieldError id={`${campusId}-type-error`}>{text.typeRequiredError}</FieldError>
						)}
					</FieldSet>

					<Field data-invalid={timeZoneIsInvalid}>
						<FieldLabel htmlFor={`${campusId}-time-zone`}>{text.timeZone}</FieldLabel>
						<Input
							id={`${campusId}-time-zone`}
							value={campus.timeZone ?? ""}
							placeholder="America/Chicago"
							spellCheck={false}
							aria-invalid={timeZoneIsInvalid}
							aria-describedby={
								timeZoneIsInvalid
									? `${campusId}-time-zone-description ${campusId}-time-zone-error`
									: `${campusId}-time-zone-description`
							}
							onChange={(event) => onChange({ ...campus, timeZone: event.target.value })}
						/>
						<FieldDescription id={`${campusId}-time-zone-description`}>
							{text.timeZoneDescription}
						</FieldDescription>
						{timeZoneIsInvalid && (
							<FieldError id={`${campusId}-time-zone-error`}>
								{campus.timeZone?.trim() ? text.invalidTimeZoneError : text.timeZoneRequiredError}
							</FieldError>
						)}
					</Field>

					<AddressFields campus={campus} campusId={campusId} text={text} onChange={onChange} />

					<ServiceFields
						campus={campus}
						campusId={campusId}
						showChoiceByDefault={shouldOfferServiceChoice}
						text={text}
						onChange={onChange}
					/>
				</FieldGroup>
			</CardContent>

			<CardFooter className="justify-end border-t">
				<Button type="button" variant="ghost" disabled={!canRemove} onClick={onRemove}>
					<Trash2 data-icon="inline-start" />
					{text.removeCampus}
				</Button>
			</CardFooter>
		</Card>
	)
}

type NestedFieldsProps = {
	campus: CampusEditorValue
	campusId: string
	text: MultiCampusEditorText
	onChange: (campus: CampusEditorValue) => void
}

function AddressFields({ campus, campusId, text, onChange }: NestedFieldsProps) {
	if (campus.address == null) {
		return (
			<Field>
				<FieldLabel>{text.address}</FieldLabel>
				<Button
					type="button"
					variant="outline"
					className="w-fit"
					onClick={() => onChange({ ...campus, address: {} })}
				>
					<Plus data-icon="inline-start" />
					{text.addAddress}
				</Button>
			</Field>
		)
	}

	const address = campus.address
	const addressFields = [
		["addressLine1", text.addressLine1],
		["addressLine2", text.addressLine2],
		["city", text.city],
		["region", text.region],
		["postalCode", text.postalCode],
		["countryCode", text.countryCode],
	] as const

	return (
		<FieldSet>
			<FieldLegend>{text.address}</FieldLegend>
			<FieldGroup className="grid md:grid-cols-2">
				{addressFields.map(([field, label]) => (
					<Field
						key={field}
						className={
							field === "addressLine1" || field === "addressLine2" ? "md:col-span-2" : undefined
						}
					>
						<FieldLabel htmlFor={`${campusId}-${field}`}>{label}</FieldLabel>
						<Input
							id={`${campusId}-${field}`}
							value={address[field] ?? ""}
							maxLength={field === "countryCode" ? 2 : undefined}
							onChange={(event) =>
								onChange(
									updateAddress(campus, {
										[field]:
											field === "countryCode"
												? event.target.value.toUpperCase()
												: event.target.value,
									}),
								)
							}
						/>
						{field === "countryCode" && (
							<FieldDescription>{text.countryCodeDescription}</FieldDescription>
						)}
					</Field>
				))}
			</FieldGroup>
			<Button
				type="button"
				variant="ghost"
				className="w-fit"
				onClick={() => onChange({ ...campus, address: null })}
			>
				<Trash2 data-icon="inline-start" />
				{text.removeAddress}
			</Button>
		</FieldSet>
	)
}

function ServiceFields({
	campus,
	campusId,
	showChoiceByDefault,
	text,
	onChange,
}: NestedFieldsProps & { showChoiceByDefault: boolean }) {
	const services =
		campus.recurringServices ?? (showChoiceByDefault ? [createDefaultService()] : undefined)

	if (services == null && !showChoiceByDefault) {
		return (
			<Field>
				<FieldLabel>{text.weeklyServices}</FieldLabel>
				<Button
					type="button"
					variant="outline"
					className="w-fit"
					onClick={() => onChange({ ...campus, recurringServices: [createDefaultService()] })}
				>
					<Plus data-icon="inline-start" />
					{text.addWeeklyService}
				</Button>
			</Field>
		)
	}

	if (services == null || services.length === 0) {
		return (
			<FieldSet>
				<FieldLegend>{text.weeklyServices}</FieldLegend>
				<FieldDescription>{text.weeklyServicesDescription}</FieldDescription>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={() => onChange({ ...campus, recurringServices: [createDefaultService()] })}
					>
						<Plus data-icon="inline-start" />
						{text.addWeeklyService}
					</Button>
					<Button
						type="button"
						variant={services?.length === 0 ? "secondary" : "ghost"}
						onClick={() => onChange({ ...campus, recurringServices: [] })}
					>
						{text.noServices}
					</Button>
				</div>
			</FieldSet>
		)
	}

	return (
		<FieldSet>
			<FieldLegend>{text.weeklyServices}</FieldLegend>
			<FieldDescription>{text.weeklyServicesDescription}</FieldDescription>
			<FieldGroup>
				{services.map((service, serviceIndex) => {
					const serviceId = `${campusId}-service-${serviceIndex}`
					const nameIsInvalid = service.name.trim().length === 0

					return (
						<FieldSet key={serviceIndex} className="rounded-lg border p-4">
							<FieldLegend variant="label">{text.serviceNumber(serviceIndex + 1)}</FieldLegend>
							<FieldGroup className="grid md:grid-cols-2">
								<Field data-invalid={nameIsInvalid} className="md:col-span-2">
									<FieldLabel htmlFor={`${serviceId}-name`}>{text.serviceName}</FieldLabel>
									<Input
										id={`${serviceId}-name`}
										value={service.name}
										aria-invalid={nameIsInvalid}
										aria-describedby={nameIsInvalid ? `${serviceId}-name-error` : undefined}
										onChange={(event) =>
											onChange(updateService(campus, serviceIndex, { name: event.target.value }))
										}
									/>
									{nameIsInvalid && (
										<FieldError id={`${serviceId}-name-error`}>
											{text.serviceNameRequiredError}
										</FieldError>
									)}
								</Field>
								<Field>
									<FieldLabel htmlFor={`${serviceId}-weekday`}>{text.weekday}</FieldLabel>
									<select
										id={`${serviceId}-weekday`}
										value={service.weekday}
										className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
										onChange={(event) =>
											onChange(
												updateService(campus, serviceIndex, {
													weekday: Number(event.target.value),
												}),
											)
										}
									>
										{text.weekdayLabels.map((weekday, weekdayIndex) => (
											<option key={weekday} value={weekdayIndex}>
												{weekday}
											</option>
										))}
									</select>
								</Field>
								<Field>
									<FieldLabel htmlFor={`${serviceId}-starts-at`}>{text.startTime}</FieldLabel>
									<Input
										id={`${serviceId}-starts-at`}
										type="time"
										value={service.startsAt}
										onChange={(event) =>
											onChange(
												updateService(campus, serviceIndex, { startsAt: event.target.value }),
											)
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor={`${serviceId}-duration`}>{text.durationMinutes}</FieldLabel>
									<Input
										id={`${serviceId}-duration`}
										type="number"
										min={1}
										value={service.durationMinutes ?? ""}
										onChange={(event) =>
											onChange(
												updateService(campus, serviceIndex, {
													durationMinutes: event.target.value ? Number(event.target.value) : null,
												}),
											)
										}
									/>
								</Field>
							</FieldGroup>
							<Button
								type="button"
								variant="ghost"
								className="w-fit"
								onClick={() =>
									onChange({
										...campus,
										recurringServices: services.filter((_, index) => index !== serviceIndex),
									})
								}
							>
								<Trash2 data-icon="inline-start" />
								{text.removeService}
							</Button>
						</FieldSet>
					)
				})}
			</FieldGroup>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() =>
						onChange({ ...campus, recurringServices: [...services, createDefaultService()] })
					}
				>
					<Plus data-icon="inline-start" />
					{text.addWeeklyService}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={() => onChange({ ...campus, recurringServices: [] })}
				>
					{text.noServices}
				</Button>
			</div>
		</FieldSet>
	)
}
