import { useEffect, useState } from "react"

import { apiClient, type ApiRequestError, type PlannedVolunteer, type TeamRole } from "@/api/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

type SelectedRole = {
	emoji: string | null
	name: string
}

export const SchedulingDialog = (props: SchedulingDialogProps) => {
	const [conflicts, setConflicts] = useState<string[]>([])
	const [selectedCandidate, setSelectedCandidate] = useState<PlannedVolunteer | null>(null)
	const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null)
	const assignment = apiClient.assignCampusEventVolunteer.useMutation()
	const updateRole = apiClient.updateCampusEventVolunteerRole.useMutation()

	useEffect(() => {
		setConflicts([])
		setSelectedCandidate(null)
		setSelectedRole(null)
	}, [props.team?.id])

	if (props.team === undefined) return null
	const team = props.team
	const roleEntries = Object.entries(team.roles)
	const isPending = assignment.isPending || updateRole.isPending

	const returnToVolunteerList = () => {
		setConflicts([])
		setSelectedCandidate(null)
		setSelectedRole(null)
	}

	const assign = (confirmConflict = false, roleToAssign = selectedRole) => {
		if (selectedCandidate === null || roleToAssign === null) return

		assignment.mutate(
			{
				accessToken: props.accessToken,
				confirmConflict,
				eventTeamId: team.id,
				teamMembershipId: selectedCandidate.teamMembershipId,
			},
			{
				onError: (error) => {
					const requestError = error as ApiRequestError
					const detail = requestError.detail as {
						detail?: { conflicts?: Array<{ eventTitle: string; teamName: string }> }
					} | null

					setConflicts(
						detail?.detail?.conflicts?.map(
							(conflict) => `${conflict.eventTitle} · ${conflict.teamName}`,
						) ?? [],
					)
				},
				onSuccess: (createdAssignment) => {
					updateRole.mutate(
						{
							accessToken: props.accessToken,
							assignmentId: createdAssignment.id,
							eventTeamId: team.id,
							roleEmoji: roleToAssign.emoji ?? "",
							roleName: roleToAssign.name,
						},
						{ onSuccess: props.onClose },
					)
				},
			},
		)
	}

	return (
		<Dialog onOpenChange={(isOpen) => !isOpen && props.onClose()} open>
			<DialogContent className="porphyra-card max-w-md">
				<DialogHeader>
					<p className="porphyra-eyebrow">Schedule volunteer</p>
					<DialogTitle className="font-serif text-3xl">{team.name}</DialogTitle>
					<DialogDescription>
						{props.ministry} · {eventTime(team, props.event)}
					</DialogDescription>
				</DialogHeader>

				{selectedCandidate === null ? (
					<>
						<p className="text-sm text-muted-foreground">
							Choose a person, then assign them to an open role.
						</p>
						<div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
							{team.eligibleVolunteers.map((volunteer) => (
								<Button
									className="h-auto justify-start whitespace-normal border-border bg-card p-3 text-left text-foreground hover:border-primary hover:bg-card"
									disabled={roleEntries.length === 0}
									key={volunteer.teamMembershipId}
									onClick={() => setSelectedCandidate(volunteer)}
									variant="outline"
								>
									<img
										alt=""
										className="size-10 rounded-full bg-secondary object-cover"
										src={volunteer.avatarUrl}
									/>
									<span className="grid min-w-0 gap-0.5">
										<strong>{volunteer.name}</strong>
										<span className="truncate text-xs font-normal text-muted-foreground">
											{volunteer.email}
										</span>
									</span>
								</Button>
							))}
						</div>
						{roleEntries.length === 0 && (
							<Alert>
								<AlertTitle>No roles configured</AlertTitle>
								<AlertDescription>
									Set this team’s service roles before scheduling volunteers.
								</AlertDescription>
							</Alert>
						)}
					</>
				) : (
					<>
						<p className="text-sm text-muted-foreground">
							Assign <strong className="text-foreground">{selectedCandidate.name}</strong> to a
							role.
						</p>
						<div className="grid gap-2">
							{roleEntries.map(([roleName, role]) => {
								const isFull = role.scheduledUsers.length >= role.count
								return (
									<RoleChoice
										disabled={isFull || isPending}
										key={roleName}
										onClick={() => {
											const roleToAssign = { emoji: role.emoji, name: roleName }
											setSelectedRole(roleToAssign)
											assign(false, roleToAssign)
										}}
										role={role}
										roleName={roleName}
									/>
								)
							})}
						</div>
						{conflicts.length > 0 && (
							<Alert>
								<AlertTitle>Schedule conflict</AlertTitle>
								<AlertDescription className="gap-3">
									<span>
										{selectedCandidate.name} is already scheduled for: {conflicts.join(", ")}
									</span>
									<Button disabled={isPending} onClick={() => assign(true)} size="sm">
										Schedule anyway
									</Button>
								</AlertDescription>
							</Alert>
						)}
					</>
				)}

				<DialogFooter>
					{selectedCandidate !== null && (
						<Button disabled={isPending} onClick={returnToVolunteerList} variant="ghost">
							Back
						</Button>
					)}
					<Button disabled={isPending} onClick={props.onClose} variant="ghost">
						Exit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

const RoleChoice = (props: {
	disabled: boolean
	onClick: () => void
	role: TeamRole
	roleName: string
}) => (
	<Button
		className="h-auto justify-between border-border bg-card p-3 text-left text-foreground hover:border-primary hover:bg-card"
		disabled={props.disabled}
		onClick={props.onClick}
		variant="outline"
	>
		<span className="flex items-center gap-3">
			<span className="text-xl">{props.role.emoji ?? "✨"}</span>
			<span className="font-semibold">{props.roleName}</span>
		</span>
		<span className="text-xs text-muted-foreground">
			{props.role.scheduledUsers.length} / {props.role.count}
		</span>
	</Button>
)
