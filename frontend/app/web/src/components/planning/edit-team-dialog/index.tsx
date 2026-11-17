import { Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { apiClient } from "@/api/client"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from "@/components/ui/emoji-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { EditTeamDialogProps } from "./types"

type RoleDraft = { count: number; emoji: string; id: string; name: string }
type VolunteerAction = { assignmentId: string; action: "drop" | "reassign"; roleName: string }

const localDateTime = (value: string | null) => {
	if (value === null) return ""
	const date = new Date(value)
	const pad = (part: number) => String(part).padStart(2, "0")
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const createRoleDraft = (role: Omit<RoleDraft, "id">): RoleDraft => ({
	...role,
	id: crypto.randomUUID(),
})

export const EditTeamDialog = (props: EditTeamDialogProps) => {
	const updateTeam = apiClient.updateCampusEventTeamRoleRequirements.useMutation()
	const [callTime, setCallTime] = useState("")
	const [callTimeChanged, setCallTimeChanged] = useState(false)
	const [roles, setRoles] = useState<RoleDraft[]>([])
	const [isConfirming, setIsConfirming] = useState(false)
	const [actions, setActions] = useState<VolunteerAction[]>([])
	const [emojiPickerRoleId, setEmojiPickerRoleId] = useState<string | null>(null)

	useEffect(() => {
		if (!props.open) return
		setCallTime(localDateTime(props.team.callTime))
		setCallTimeChanged(false)
		setRoles(
			Object.entries(props.team.roles).map(([name, role]) =>
				createRoleDraft({
					count: role.count,
					emoji: role.emoji ?? "",
					name,
				}),
			),
		)
		setActions([])
		setIsConfirming(false)
	}, [props.open, props.team])

	const roleNames = useMemo(() => roles.map((role) => role.name.trim()).filter(Boolean), [roles])
	const rolesAreValid =
		roleNames.length === roles.length &&
		new Set(roleNames).size === roleNames.length &&
		roles.every((role) => role.count >= 1)
	const affectedVolunteers = props.team.volunteers.filter(
		(volunteer) => callTimeChanged || !roleNames.includes(volunteer.roleName ?? ""),
	)

	const beginConfirmation = () => {
		if (!rolesAreValid) return
		if (affectedVolunteers.length === 0) {
			void save([])
			return
		}
		setActions(
			affectedVolunteers.map((volunteer) => ({
				action:
					callTimeChanged || roleNames.includes(volunteer.roleName ?? "") ? "reassign" : "drop",
				assignmentId: volunteer.assignmentId,
				roleName: roleNames.includes(volunteer.roleName ?? "")
					? (volunteer.roleName ?? "")
					: (roleNames[0] ?? ""),
			})),
		)
		setIsConfirming(true)
	}

	const save = (volunteerActions: VolunteerAction[]) => {
		updateTeam.mutate(
			{
				affectedVolunteers: volunteerActions.map((item) => ({
					action: item.action,
					assignmentId: item.assignmentId,
					roleName: item.action === "reassign" ? item.roleName : null,
				})),
				callTime: callTimeChanged
					? callTime === ""
						? null
						: new Date(callTime).toISOString()
					: props.team.callTime,
				event_team_id: props.team.id,
				roles: Object.fromEntries(
					roles.map((role) => [role.name.trim(), { count: role.count, emoji: role.emoji || null }]),
				),
			},
			{
				onError: () => toast.error("The team could not be updated. Refresh and try again."),
				onSuccess: () => {
					toast.success("Team requirements updated.")
					props.onOpenChange(false)
				},
			},
		)
	}

	const updateRole = (index: number, updates: Partial<RoleDraft>) =>
		setRoles((current) =>
			current.map((role, roleIndex) => (roleIndex === index ? { ...role, ...updates } : role)),
		)

	return (
		<Dialog onOpenChange={props.onOpenChange} open={props.open}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{isConfirming ? "Confirm volunteer changes" : `Edit ${props.team.name}`}
					</DialogTitle>
					<DialogDescription>
						{isConfirming
							? "Choose how to handle volunteers affected by these service changes. Reassigned volunteers receive a new request to confirm."
							: "Update the roles this team needs and its call time for this service."}
					</DialogDescription>
				</DialogHeader>

				{isConfirming ? (
					<div className="grid gap-4">
						{callTimeChanged && (
							<p className="rounded-md border border-accent bg-accent/10 p-3 text-sm">
								The call time changed. Every scheduled volunteer will receive a new request to
								confirm.
							</p>
						)}
						{affectedVolunteers.map((volunteer) => {
							const action = actions.find((item) => item.assignmentId === volunteer.assignmentId)
							if (action === undefined) return null
							return (
								<div className="grid gap-2 rounded-md border p-3" key={volunteer.assignmentId}>
									<strong>{volunteer.name}</strong>
									<div className="flex flex-wrap items-center gap-3 text-sm">
										<label className="flex items-center gap-2">
											<input
												checked={action.action === "reassign"}
												onChange={() =>
													setActions((current) =>
														current.map((item) =>
															item.assignmentId === action.assignmentId
																? { ...item, action: "reassign" }
																: item,
														),
													)
												}
												type="radio"
											/>
											Reassign for confirmation
										</label>
										<label className="flex items-center gap-2">
											<input
												checked={action.action === "drop"}
												onChange={() =>
													setActions((current) =>
														current.map((item) =>
															item.assignmentId === action.assignmentId
																? { ...item, action: "drop" }
																: item,
														),
													)
												}
												type="radio"
											/>
											Drop from this service
										</label>
										{action.action === "reassign" && (
											<select
												className="h-9 rounded-md border border-input bg-background px-2"
												onChange={(event) =>
													setActions((current) =>
														current.map((item) =>
															item.assignmentId === action.assignmentId
																? { ...item, roleName: event.target.value }
																: item,
														),
													)
												}
												value={action.roleName}
											>
												{roles.map((role) => (
													<option key={role.name} value={role.name}>
														{role.emoji} {role.name}
													</option>
												))}
											</select>
										)}
									</div>
								</div>
							)
						})}
					</div>
				) : (
					<div className="grid gap-5">
						<div className="grid gap-2">
							<Label htmlFor="team-call-time">Call time</Label>
							<Input
								id="team-call-time"
								onChange={(event) => {
									setCallTime(event.target.value)
									setCallTimeChanged(true)
								}}
								type="datetime-local"
								value={callTime}
							/>
							<p className="text-xs text-muted-foreground">
								Changing this asks every scheduled volunteer to confirm again.
							</p>
						</div>
						<div className="grid gap-3">
							<Label>Service roles</Label>
							{roles.map((role, index) => (
								<div className="grid grid-cols-[5rem_1fr_5rem_auto] gap-2" key={role.id}>
									<Popover
										onOpenChange={(open) => setEmojiPickerRoleId(open ? role.id : null)}
										open={emojiPickerRoleId === role.id}
									>
										<PopoverTrigger asChild>
											<Button
												aria-label={`Choose emoji for ${role.name || `role ${index + 1}`}`}
												type="button"
												variant="outline"
											>
												{role.emoji || "✨"}
											</Button>
										</PopoverTrigger>
										<PopoverContent align="start" className="h-96 w-80 p-0">
											<EmojiPicker
												onEmojiSelect={({ emoji }) => {
													updateRole(index, { emoji })
													setEmojiPickerRoleId(null)
												}}
											>
												<EmojiPickerSearch />
												<EmojiPickerContent />
											</EmojiPicker>
										</PopoverContent>
									</Popover>
									<Input
										aria-label={`Name for role ${index + 1}`}
										onChange={(event) => updateRole(index, { name: event.target.value })}
										placeholder="Role name"
										value={role.name}
									/>
									<Input
										aria-label={`Volunteer count for ${role.name || `role ${index + 1}`}`}
										min="1"
										onChange={(event) => updateRole(index, { count: Number(event.target.value) })}
										type="number"
										value={role.count}
									/>
									<Button
										aria-label={`Remove ${role.name || "role"}`}
										onClick={() =>
											setRoles((current) => current.filter((_, roleIndex) => roleIndex !== index))
										}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Trash2 />
									</Button>
								</div>
							))}
							<Button
								className="w-fit"
								onClick={() =>
									setRoles((current) => [
										...current,
										createRoleDraft({ count: 1, emoji: "", name: "" }),
									])
								}
								type="button"
								variant="outline"
							>
								<Plus /> Add role
							</Button>
						</div>
					</div>
				)}
				<DialogFooter>
					<Button
						disabled={updateTeam.isPending}
						onClick={() => (isConfirming ? setIsConfirming(false) : props.onOpenChange(false))}
						type="button"
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						disabled={
							updateTeam.isPending ||
							!rolesAreValid ||
							(isConfirming &&
								actions.some(
									(action) => action.action === "reassign" && !roleNames.includes(action.roleName),
								))
						}
						onClick={() => (isConfirming ? save(actions) : beginConfirmation())}
						type="button"
					>
						{isConfirming ? "Apply changes" : "Review changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
