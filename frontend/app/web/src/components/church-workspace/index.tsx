import { Link } from "@tanstack/react-router"
import { AlertCircle, ArrowRight, CalendarDays } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ComputedText, Localized, LocalizationScope } from "@/localization"
import { MultiCampusChurchView } from "./multi-campus-view"
import { SingleCampusChurchView } from "./single-campus-view"
import type { ChurchWorkspaceProps } from "./types"

export const ChurchWorkspace = ({ church, isError, isLoading }: ChurchWorkspaceProps) => {
	if (isLoading) {
		return (
			<LocalizationScope name="church-workspace.loading">
				<main className="mx-auto max-w-310 px-6 py-12">
					<Card className="min-h-80 items-center justify-center">
						<CardContent>
							<Localized str="churchWorkspace.loading" />
						</CardContent>
					</Card>
				</main>
			</LocalizationScope>
		)
	}

	if (isError || church === undefined) {
		return (
			<LocalizationScope name="church-workspace.error">
				<main className="mx-auto max-w-310 px-6 py-12">
					<Alert variant="destructive">
						<AlertCircle />
						<AlertTitle>
							<Localized str="churchWorkspace.unavailableTitle" />
						</AlertTitle>
						<AlertDescription>
							<Localized str="churchWorkspace.unavailableDescription" />
						</AlertDescription>
					</Alert>
				</main>
			</LocalizationScope>
		)
	}

	const isSingleCampus = church.campuses.length === 1

	return (
		<LocalizationScope name="church-workspace">
			<main className="mx-auto flex max-w-310 flex-col gap-8 px-6 py-12">
				<section className="overflow-hidden rounded-2xl border bg-card">
					<div className="h-3 bg-primary" />
					<div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-10">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
							<Avatar className="size-20 rounded-2xl sm:size-24">
								<AvatarImage alt={`${church.name} profile`} src={church.avatarUrl} />
								<AvatarFallback className="rounded-2xl font-serif text-2xl">
									<ComputedText value={church.name.slice(0, 1)} />
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="mb-2 text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
									<Localized
										str={
											isSingleCampus
												? "churchWorkspace.singleEyebrow"
												: "churchWorkspace.multiEyebrow"
										}
									/>
								</p>
								<h1 className="font-serif text-4xl leading-none font-bold tracking-tight md:text-6xl">
									<ComputedText value={church.name} />
								</h1>
								<p className="mt-3 max-w-2xl text-muted-foreground">
									{church.description ? (
										<ComputedText value={church.description} />
									) : (
										<Localized
											str={
												isSingleCampus
													? "churchWorkspace.singleWelcome"
													: "churchWorkspace.multiWelcome"
											}
										/>
									)}
								</p>
							</div>
						</div>
						<Button asChild size="lg">
							<Link params={{ churchId: church.id }} to="/app/planning/churches/$churchId">
								<CalendarDays data-icon="inline-start" />
								<Localized str="churchWorkspace.openPlanning" />
								<ArrowRight data-icon="inline-end" />
							</Link>
						</Button>
					</div>
				</section>

				{isSingleCampus ? (
					<SingleCampusChurchView church={church} />
				) : (
					<MultiCampusChurchView church={church} />
				)}
			</main>
		</LocalizationScope>
	)
}
