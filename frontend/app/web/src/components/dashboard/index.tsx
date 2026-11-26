import { AlertCircle, MapPin } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ComputedText, Localized, LocalizationScope } from "@/localization"
import type { DashboardProps } from "./types"

export const Dashboard = ({ churches, isError, isLoading, viewerName }: DashboardProps) => (
	<LocalizationScope name="dashboard">
		<div className="mx-auto max-w-310 px-6 py-12">
			<section className="mb-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
				<div>
					<p className="mb-3 text-xs font-extrabold tracking-[0.12em] text-primary uppercase">
						<Localized str="dashboard.greeting" values={{ name: viewerName ?? "friend" }} />
					</p>
					<h1 className="font-serif text-5xl leading-[0.96] font-bold tracking-[-0.055em] md:text-7xl">
						<Localized str="dashboard.title" />
					</h1>
					<p className="mt-5 max-w-162 text-muted-foreground">
						<Localized str="dashboard.description" />
					</p>
				</div>
				<Badge variant="secondary">
					<Localized str="dashboard.churches" values={{ count: churches.length }} />
				</Badge>
			</section>
			{isLoading && (
				<p>
					<Localized str="dashboard.loadingChurches" />
				</p>
			)}
			{isError && (
				<Alert variant="destructive">
					<AlertCircle />
					<AlertDescription>
						<Localized str="dashboard.apiUnavailable" /> <code>bun run dev</code>.
					</AlertDescription>
				</Alert>
			)}
			<LocalizationScope name="dashboard.church-cards">
				<section className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
					{churches.map((church) => (
						<Card
							className="gap-4 overflow-hidden border-t-3 border-t-primary py-5"
							key={church.id}
						>
							<CardHeader className="px-5">
								<Avatar className="rounded-xl" size="lg">
									<AvatarImage alt={`${church.name} profile`} src={church.avatarUrl} />
									<AvatarFallback className="rounded-xl">
										<ComputedText value={church.name.slice(0, 1)} />
									</AvatarFallback>
								</Avatar>
								<div className="mt-3">
									<Localized asChild str="dashboard.church">
										<p className="mb-2 text-xs font-extrabold tracking-[0.12em] text-primary uppercase" />
									</Localized>
									<CardTitle className="font-serif text-2xl">
										<ComputedText value={church.name} />
									</CardTitle>
									<CardDescription className="mt-2 leading-6">
										<ComputedText value={church.description} />
									</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="flex flex-col gap-4 px-5">
								<div className="flex flex-col gap-2">
									<Separator />
									{church.campuses.map((campus) => (
										<span
											className="flex items-center gap-1 text-sm text-muted-foreground"
											key={campus.id}
										>
											<MapPin className="size-4 shrink-0 text-primary" />
											<ComputedText value={`${campus.name} · ${campus.location.city}`} />
										</span>
									))}
								</div>
								<div className="flex flex-col gap-2">
									<Separator />
									<div className="flex flex-wrap gap-2">
										{church.ministries.flatMap((ministry) =>
											ministry.teams.map((team) => (
												<Badge key={team.id} variant="secondary">
													<ComputedText value={`${ministry.name} · ${team.name}`} />
												</Badge>
											)),
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</section>
			</LocalizationScope>
		</div>
	</LocalizationScope>
)
