import { useEffect, useState } from "react"
import { toast } from "sonner"

import { apiClient, type PlannedVolunteer } from "@/api/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import type { SchedulingDialogProps } from "./types"

const formatTime = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value))

const eventTime = (
	team: NonNullable<SchedulingDialogProps["team"]>,
	event: SchedulingDialogProps["event"],
) =>
	team.callTime === null ? `Event start ${formatTime(event.startsAt)}` : formatTime(team.callTime)

const initials = (name: string) =>
	name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

export const SchedulingDialog = (props: SchedulingDialogProps) => {
	const [error, setError] = useState<string | null>(null)
	const [sendingVolunteerId, setSendingVolunteerId] = useState<string | null>(null)
	const assignment = apiClient.assignCampusEventVolunteer.useMutation()
	const replacement = apiClient.createVolunteerReplacement.useMutation()

	useEffect(() => {
		setError(null)
		setSendingVolunteerId(null)
	}, [props.roleName, props.team?.id])

	if (props.team === undefined || props.roleName === null) return null

	const team = props.team
	const roleName = props.roleName
	const role = team.roles[roleName]
	if (role === undefined) return null

	const isFull = role.scheduledUsers.length >= role.count
	const sendRequest = (volunteer: PlannedVolunteer) => {
		setError(null)
		setSendingVolunteerId(volunteer.teamMembershipId)
		const options = {
			onError: () => {
				setSendingVolunteerId(null)
				setError("This role is no longer available. The schedule has been refreshed.")
			},
			onSuccess: () => {
				toast.success(`Request sent to ${volunteer.name} for ${roleName}.`)
				props.onClose()
			},
		}
		const request = {
			confirmConflict: false,
			event_team_id: team.id,
			roleEmoji: role.emoji,
			roleName,
			teamMembershipId: volunteer.teamMembershipId,
		}
		if (props.replacementRequestId === undefined) assignment.mutate(request, options)
		else replacement.mutate({ ...request, request_id: props.replacementRequestId }, options)
	}

	return (
		<Dialog onOpenChange={(isOpen) => !isOpen && props.onClose()} open>
			<DialogContent className="porphyra-card max-w-md">
				<DialogHeader>
					<p className="porphyra-eyebrow">Schedule volunteer</p>
					<DialogTitle className="font-serif text-3xl">{props.team.name}</DialogTitle>
					<DialogDescription>
						{props.ministry} · {eventTime(props.team, props.event)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">
						Role: {role.emoji ?? "✨"} {props.roleName} ({role.scheduledUsers.length}/{role.count})
					</Badge>
				</div>
				<p className="text-sm text-muted-foreground">
					Choose a volunteer for <strong className="text-foreground">{props.roleName}</strong>.
				</p>

				{error !== null && (
					<Alert variant="destructive">
						<AlertTitle>Unable to send request</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{isFull ? (
					<Alert>
						<AlertTitle>Role is filled</AlertTitle>
						<AlertDescription>This role was filled while this window was open.</AlertDescription>
					</Alert>
				) : props.team.eligibleVolunteers.length > 0 ? (
					<div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
						{props.team.eligibleVolunteers.map((volunteer) => (
							<VolunteerChoice
								isSending={sendingVolunteerId === volunteer.teamMembershipId}
								key={volunteer.teamMembershipId}
								onClick={() => sendRequest(volunteer)}
								volunteer={volunteer}
							/>
						))}
					</div>
				) : (
					<Alert>
						<AlertTitle>No available volunteers</AlertTitle>
						<AlertDescription>
							No available volunteers for {props.roleName} on this date. Adjust team membership or
							availability to schedule someone.
						</AlertDescription>
					</Alert>
				)}

				<DialogFooter>
					<Button
						disabled={assignment.isPending || replacement.isPending}
						onClick={props.onClose}
						variant="ghost"
					>
						Exit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

const VolunteerChoice = (props: {
	isSending: boolean
	onClick: () => void
	volunteer: PlannedVolunteer
}) => (
	<Button
		aria-label={`Send ${props.volunteer.name} a request`}
		className="h-auto justify-start whitespace-normal border-border bg-card p-3 text-left text-foreground hover:border-primary hover:bg-card"
		disabled={props.isSending}
		onClick={props.onClick}
		variant="outline"
	>
		<Avatar size="lg">
			<AvatarImage alt="" src={props.volunteer.avatarUrl} />
			<AvatarFallback>{initials(props.volunteer.name)}</AvatarFallback>
		</Avatar>
		<span className="grid min-w-0 gap-0.5">
			<strong>{props.isSending ? "Sending request…" : props.volunteer.name}</strong>
			<span className="truncate text-xs font-normal text-muted-foreground">
				{props.volunteer.email}
			</span>
		</span>
	</Button>
)
