import { Check, Clock3, UserPlus } from "lucide-react"

import { RoleEditor } from "@/components/planning/role-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { TeamCardProps } from "./types"

const formatTime = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value))

const eventTime = (team: TeamCardProps["team"], event: TeamCardProps["event"]) =>
	team.callTime === null ? `Event start ${formatTime(event.startsAt)}` : formatTime(team.callTime)

export const TeamCard = (props: TeamCardProps) => {
	const isConfirmed = props.team.confirmedAt !== null
	const volunteerCount = props.team.volunteers.length

	return (
		<Card
			aria-label={`${props.team.name}, ${isConfirmed ? "confirmed" : "needs attention"}`}
			className="porphyra-card min-h-96 gap-0 py-0"
		>
			<CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5">
				<div>
					<h3 className="m-0 text-lg font-semibold">{props.team.name}</h3>
					<p
						className={`mt-2 flex items-center gap-1 text-sm font-bold ${props.team.callTime === null ? "text-muted-foreground" : "text-primary"}`}
					>
						<Clock3 aria-hidden="true" size={15} />
						{eventTime(props.team, props.event)}
					</p>
				</div>
				<Badge
					className={
						isConfirmed
							? "bg-primary/10 text-primary hover:bg-primary/10"
							: "bg-destructive/10 text-destructive hover:bg-destructive/10"
					}
					variant="secondary"
				>
					{isConfirmed && <Check aria-hidden="true" size={14} />}
					{isConfirmed ? "Confirmed" : "Needs attention"}
				</Badge>
			</CardHeader>
			<CardContent>
				{props.team.notes.map((note) => (
					<p className="m-0 text-sm leading-6 text-muted-foreground" key={note}>
						{note}
					</p>
				))}
				<Separator />
				<div>
					<div className="flex justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
						<span>Service roles</span>
						<span>{props.team.isFullyStaffed ? "Fully staffed" : "Needs volunteers"}</span>
					</div>
					<div className="mt-3 grid gap-2">
						{Object.entries(props.team.roles).map(([roleName, role]) => (
							<div
								className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm"
								key={roleName}
							>
								<span className="flex items-center gap-2 font-semibold">
									<span aria-hidden="true">{role.emoji ?? "✨"}</span>
									{roleName}
								</span>
								<span className="text-muted-foreground">
									{role.scheduledUsers.length} / {role.count}
								</span>
							</div>
						))}
					</div>
				</div>
				<Separator />
				<div>
					<div className="flex justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
						<span>Roster</span>
						<span>
							{volunteerCount} {volunteerCount === 1 ? "volunteer" : "volunteers"}
						</span>
					</div>
					{volunteerCount > 0 ? (
						<div className="min-w-0 max-w-full">
							<ScrollArea
								className="mt-3 w-full min-w-0 max-w-full overflow-hidden"
								scrollbarOrientation="horizontal"
								type="hover"
							>
								<div className="flex w-max gap-3 pb-3">
									{props.team.volunteers.map((volunteer) => (
										<RoleEditor
											accessToken={props.accessToken}
											eventTeamId={props.team.id}
											key={volunteer.assignmentId}
											volunteer={volunteer}
										/>
									))}
								</div>
							</ScrollArea>
						</div>
					) : (
						<p className="mt-3 text-sm text-muted-foreground">No volunteer scheduled yet.</p>
					)}
				</div>
			</CardContent>
			<CardFooter className="mt-auto px-5 pt-5 pb-5">
				{props.team.eligibleVolunteers.length > 0 && (
					<Button
						className="font-bold max-md:flex-1"
						onClick={props.onSchedule}
						size="lg"
						variant="secondary"
					>
						<UserPlus size={17} />
						Schedule volunteer
					</Button>
				)}
			</CardFooter>
		</Card>
	)
}
