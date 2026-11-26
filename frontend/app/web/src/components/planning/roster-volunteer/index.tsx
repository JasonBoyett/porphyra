import { useState } from "react"
import { Ellipsis, Pencil, UserMinus } from "lucide-react"
import { toast } from "sonner"

import { apiClient } from "@/api/client"
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ComputedText, Localized, LocalizationScope } from "@/localization"
import type { RosterVolunteerProps } from "./types"

const initials = (name: string) =>
	name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()

export const RosterVolunteer = (props: RosterVolunteerProps) => {
	const [isDropDialogOpen, setIsDropDialogOpen] = useState(false)
	const changeRole = apiClient.changeCampusEventVolunteerRole.useMutation()
	const dropVolunteer = apiClient.dropCampusEventVolunteer.useMutation()
	const canManageAssignment =
		props.status === "accepted" &&
		props.eventTeamId !== undefined &&
		props.volunteerId !== undefined
	const roles = Object.entries(props.roles ?? {})

	const changeRoleTo = (roleName: string) => {
		const role = props.roles?.[roleName]
		if (role === undefined || props.eventTeamId === undefined || props.volunteerId === undefined)
			return
		changeRole.mutate(
			{
				event_team_id: props.eventTeamId,
				roleEmoji: role.emoji,
				roleName,
				volunteer_id: props.volunteerId,
			},
			{
				onError: () => toast.error(`Unable to update ${props.name}'s role.`),
				onSuccess: () => toast.success(`${props.name}'s role was updated.`),
			},
		)
	}

	const drop = () => {
		if (props.eventTeamId === undefined || props.volunteerId === undefined) return
		dropVolunteer.mutate(
			{
				event_team_id: props.eventTeamId,
				volunteer_id: props.volunteerId,
			},
			{
				onError: () => toast.error(`Unable to remove ${props.name} from the roster.`),
				onSuccess: () => {
					setIsDropDialogOpen(false)
					toast.success(`${props.name} was removed from the roster.`)
				},
			},
		)
	}

	return (
		<div className="porphyra-roster-item relative flex w-64 shrink-0 items-center gap-3 pr-9 text-secondary-foreground">
			<Avatar className="size-10">
				<AvatarImage alt={`${props.name} profile`} src={props.avatarUrl} />
				<AvatarFallback>
					<ComputedText value={initials(props.name)} />
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<strong>
					<ComputedText value={props.name} />
				</strong>
				<small className="block truncate text-xs">
					<ComputedText value={props.email} />
				</small>
				<div className="mt-1 flex items-center gap-1 text-xs">
					<span>
						<ComputedText value={props.roleEmoji ?? "✨"} />
					</span>
					<LocalizationScope name="planning.roster-volunteer-status">
						<span>
							{props.roleName === null ? (
								<Localized str="navigation.volunteer" />
							) : (
								<ComputedText value={props.roleName} />
							)}
						</span>
						<Badge
							className={
								props.status === "pending"
									? "bg-accent/20 text-accent-foreground hover:bg-accent/20"
									: "bg-primary/10 text-primary hover:bg-primary/10"
							}
							variant="secondary"
						>
							<Localized
								str={
									props.status === "pending"
										? "planning.volunteerPending"
										: "planning.volunteerAccepted"
								}
							/>
						</Badge>
					</LocalizationScope>
				</div>
			</div>
			{canManageAssignment && (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								aria-label={`Actions for ${props.name}`}
								className="absolute top-2 right-2"
								size="icon-xs"
								variant="ghost"
							>
								<Ellipsis />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuGroup>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>
										<Pencil />
										<Localized str="planning.changeRole" />
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent>
										<DropdownMenuGroup>
											<DropdownMenuRadioGroup value={props.roleName ?? ""}>
												{roles.map(([roleName, role]) => (
													<DropdownMenuRadioItem
														disabled={
															changeRole.isPending ||
															(roleName !== props.roleName &&
																role.scheduledUsers.length >= role.count)
														}
														key={roleName}
														onSelect={() => changeRoleTo(roleName)}
														value={roleName}
													>
														<ComputedText value={`${role.emoji ?? "✨"} ${roleName}`} />
													</DropdownMenuRadioItem>
												))}
											</DropdownMenuRadioGroup>
										</DropdownMenuGroup>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem
									disabled={dropVolunteer.isPending}
									onSelect={() => setIsDropDialogOpen(true)}
									variant="destructive"
								>
									<UserMinus />
									<Localized str="planning.dropFromService" />
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Dialog onOpenChange={setIsDropDialogOpen} open={isDropDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									<Localized str="planning.dropVolunteerTitle" values={{ name: props.name }} />
								</DialogTitle>
								<DialogDescription>
									<Localized
										str="planning.dropVolunteerDescription"
										values={{ name: props.name }}
									/>
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button onClick={() => setIsDropDialogOpen(false)} variant="outline">
									<Localized str="planning.cancel" />
								</Button>
								<Button disabled={dropVolunteer.isPending} onClick={drop} variant="destructive">
									<UserMinus data-icon="inline-start" />
									<Localized str="planning.dropVolunteer" />
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</>
			)}
		</div>
	)
}
