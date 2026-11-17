import { AlertTriangle, Check, Clock3, Pencil, Plus, UserPlus } from "lucide-react"
import { useState } from "react"

import { EditTeamDialog } from "@/components/planning/edit-team-dialog"
import { RosterVolunteer } from "@/components/planning/roster-volunteer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
	const [isEditing, setIsEditing] = useState(false)
	const pendingRequests = (props.team.volunteerRequests ?? []).filter(
		(request) => request.status === "pending",
	)
	const rejectedRequests = (props.team.volunteerRequests ?? []).filter(
		(request) => request.status === "rejected",
	)
	const volunteerCount = props.team.volunteers.length + pendingRequests.length
	const acceptedCount = Object.values(props.team.roles).reduce(
		(total, role) => total + (role.acceptedCount ?? role.scheduledUsers.length),
		0,
	)
	const pendingCount = Object.values(props.team.roles).reduce(
		(total, role) => total + (role.pendingCount ?? 0),
		0,
	)
	const requiredCount = Object.values(props.team.roles).reduce(
		(total, role) => total + role.count,
		0,
	)
	const status =
		rejectedRequests.length > 0
			? {
					className: "bg-rejected/10 text-rejected hover:bg-rejected/10",
					label: "Pending rejections",
				}
			: acceptedCount + pendingCount < requiredCount
				? {
						className: "bg-secondary/60 text-secondary-foreground hover:bg-secondary/60",
						label: "Needs volunteers",
					}
				: pendingCount > 0
					? {
							className: "bg-accent/20 text-accent-foreground hover:bg-accent/20",
							label: "Awaiting confirmation",
						}
					: { className: "bg-primary/10 text-primary hover:bg-primary/10", label: "Ready" }

	return (
		<Card
			aria-label={`${props.team.name}, ${status.label}`}
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
				<div className="flex items-center gap-2">
					<Badge className={status.className} variant="secondary">
						{status.label === "Ready" && <Check aria-hidden="true" size={14} />}
						{status.label}
					</Badge>
					<Button
						aria-label={`Edit ${props.team.name}`}
						onClick={() => setIsEditing(true)}
						size="icon"
						variant="ghost"
					>
						<Pencil />
					</Button>
				</div>
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
					</div>
					<div className="mt-3 grid gap-2">
						{Object.entries(props.team.roles).map(([roleName, role]) => {
							const accepted = role.acceptedCount ?? role.scheduledUsers.length
							const pending = role.pendingCount ?? 0
							const isFull = accepted + pending >= role.count

							return (
								<button
									aria-label={
										isFull
											? `${roleName}: ${accepted} accepted and ${pending} pending of ${role.count}`
											: `Schedule a volunteer for ${roleName}`
									}
									className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-left text-sm transition-colors enabled:cursor-pointer enabled:hover:bg-secondary enabled:focus-visible:outline-none enabled:focus-visible:ring-3 enabled:focus-visible:ring-ring/50 disabled:cursor-default"
									disabled={isFull}
									key={roleName}
									onClick={() => props.onSchedule(roleName)}
									type="button"
								>
									<span className="flex items-center gap-2 font-semibold">
										<span aria-hidden="true">{role.emoji ?? "✨"}</span>
										{roleName}
									</span>
									<span className="flex items-center gap-2 text-muted-foreground">
										{accepted} / {role.count}
										{pending > 0 && ` · ${pending} pending`}
										{!isFull && <Plus aria-hidden="true" className="text-primary" />}
									</span>
								</button>
							)
						})}
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
					{volunteerCount > 0 || rejectedRequests.length > 0 ? (
						<div className="min-w-0 max-w-full">
							<ScrollArea
								className="mt-3 w-full min-w-0 max-w-full overflow-hidden"
								scrollbarOrientation="horizontal"
								type="hover"
							>
								<div className="flex w-max gap-3 pb-3">
									{rejectedRequests.map((request) => (
										<Button
											aria-label={`Find a replacement for ${request.name} as ${request.roleName}`}
											className="h-auto w-64 shrink-0 justify-start border-rejected/50 bg-rejected/10 p-3 text-left text-rejected hover:border-rejected hover:bg-rejected/15"
											disabled={request.roleName === null}
											key={request.id}
											onClick={() => {
												if (request.roleName !== null) {
													props.onSchedule(request.roleName, request.id)
												}
											}}
											variant="outline"
										>
											<AlertTriangle data-icon="inline-start" />
											<span className="grid gap-0.5">
												<strong>{request.name} declined</strong>
												<span className="text-xs font-normal">
													{request.roleEmoji ?? "✨"} {request.roleName ?? "Volunteer"} · Find
													replacement
												</span>
											</span>
											<UserPlus data-icon="inline-end" />
										</Button>
									))}
									{props.team.volunteers.map((volunteer) => (
										<RosterVolunteer
											accessToken={props.accessToken}
											avatarUrl={volunteer.avatarUrl}
											email={volunteer.email}
											eventTeamId={props.team.id}
											key={volunteer.assignmentId}
											name={volunteer.name}
											roleEmoji={volunteer.roleEmoji}
											roleName={volunteer.roleName}
											roles={props.team.roles}
											status="accepted"
											volunteerId={volunteer.assignmentId}
										/>
									))}
									{pendingRequests.map((request) => (
										<RosterVolunteer
											avatarUrl={request.avatarUrl}
											email={request.email}
											key={request.id}
											name={request.name}
											roleEmoji={request.roleEmoji}
											roleName={request.roleName}
											status="pending"
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
			{isEditing && <EditTeamDialog onOpenChange={setIsEditing} open team={props.team} />}
		</Card>
	)
}
