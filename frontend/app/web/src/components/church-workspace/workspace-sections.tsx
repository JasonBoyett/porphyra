import type { ReactNode } from "react"
import { MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ComputedText, Localized } from "@/localization"
import type { ChurchWorkspaceChurch } from "./types"

type SummaryLabelKey =
	| "churchWorkspace.campuses"
	| "churchWorkspace.locations"
	| "churchWorkspace.ministries"
	| "churchWorkspace.teams"
type CampusTitleKey = "churchWorkspace.campusTitle" | "churchWorkspace.singleLocationTitle"
type CampusDescriptionKey =
	"churchWorkspace.campusDescription" | "churchWorkspace.singleLocationDescription"
type NextStepKey =
	| "churchWorkspace.nextCampus"
	| "churchWorkspace.nextEvent"
	| "churchWorkspace.nextLocation"
	| "churchWorkspace.nextTeam"

export const SummaryCard = ({
	icon,
	label,
	value,
}: {
	icon: ReactNode
	label: SummaryLabelKey
	value: number
}) => (
	<Card>
		<CardContent className="flex items-center gap-4 pt-6">
			<div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div>
			<div>
				<p className="font-serif text-3xl font-bold">
					<ComputedText value={value} />
				</p>
				<p className="text-sm text-muted-foreground">
					<Localized str={label} />
				</p>
			</div>
		</CardContent>
	</Card>
)

export const CampusListCard = ({
	campuses,
	description,
	title,
}: {
	campuses: ChurchWorkspaceChurch["campuses"]
	description: CampusDescriptionKey
	title: CampusTitleKey
}) => (
	<Card>
		<CardHeader>
			<CardTitle className="font-serif text-2xl">
				<Localized str={title} />
			</CardTitle>
			<CardDescription>
				<Localized str={description} />
			</CardDescription>
		</CardHeader>
		<CardContent className="flex flex-col gap-4">
			{campuses.map((campus, index) => (
				<div key={campus.id}>
					{index > 0 && <Separator className="mb-4" />}
					<div className="flex items-start gap-3">
						<div className="rounded-lg bg-primary/10 p-2 text-primary">
							<MapPin />
						</div>
						<div className="min-w-0 flex-1">
							<p className="font-semibold">
								<ComputedText value={campus.name} />
							</p>
							<p className="text-sm text-muted-foreground">
								<ComputedText value={campus.location.city ?? campus.location.timeZone} />
							</p>
						</div>
					</div>
				</div>
			))}
		</CardContent>
	</Card>
)

export const NextStepsCard = ({
	firstStep,
}: {
	firstStep: "churchWorkspace.nextCampus" | "churchWorkspace.nextLocation"
}) => (
	<Card>
		<CardHeader>
			<CardTitle className="font-serif text-2xl">
				<Localized str="churchWorkspace.nextTitle" />
			</CardTitle>
			<CardDescription>
				<Localized str="churchWorkspace.nextDescription" />
			</CardDescription>
		</CardHeader>
		<CardContent className="flex flex-col gap-3">
			<NextStep number={1} text={firstStep} />
			<NextStep number={2} text="churchWorkspace.nextTeam" />
			<NextStep number={3} text="churchWorkspace.nextEvent" />
		</CardContent>
	</Card>
)

const NextStep = ({ number, text }: { number: number; text: NextStepKey }) => (
	<div className="flex items-start gap-3 rounded-xl border p-3">
		<Badge className="mt-0.5" variant="secondary">
			<ComputedText value={number} />
		</Badge>
		<p className="text-sm leading-6">
			<Localized str={text} />
		</p>
	</div>
)
