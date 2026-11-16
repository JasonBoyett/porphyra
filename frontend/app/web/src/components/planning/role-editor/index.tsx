import { useState } from "react"

import { apiClient } from "@/api/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	EmojiPicker,
	EmojiPickerContent,
	EmojiPickerFooter,
	EmojiPickerSearch,
} from "@/components/ui/emoji-picker"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Localized, useLocalizedString } from "@/localization"
import type { RoleEditorProps } from "./types"

const initials = (name: string) =>
	name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)

export const RoleEditor = (props: RoleEditorProps) => {
	const [isEditing, setIsEditing] = useState(false)
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
	const [roleName, setRoleName] = useState(props.volunteer.roleName ?? "")
	const [roleEmoji, setRoleEmoji] = useState(props.volunteer.roleEmoji ?? "")
	const updateRole = apiClient.updateCampusEventVolunteerRole.useMutation()
	const { text: roleAriaLabel } = useLocalizedString("planning.roleAriaLabel", {
		name: props.volunteer.name,
	})
	const { text: rolePlaceholder } = useLocalizedString("planning.role")

	const save = () => {
		updateRole.mutate(
			{
				accessToken: props.accessToken,
				assignmentId: props.volunteer.assignmentId,
				eventTeamId: props.eventTeamId,
				roleEmoji,
				roleName,
			},
			{ onSuccess: () => setIsEditing(false) },
		)
	}

	return (
		<div className="porphyra-roster-item flex w-64 shrink-0 items-center gap-3 text-secondary-foreground">
			<Avatar className="size-10">
				<AvatarImage alt={`${props.volunteer.name} profile`} src={props.volunteer.avatarUrl} />
				<AvatarFallback>{initials(props.volunteer.name)}</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<strong>{props.volunteer.name}</strong>
				<small className="block truncate text-xs">{props.volunteer.email}</small>
				{!isEditing && (
					<Button
						className="h-auto px-0 py-1 text-xs"
						onClick={() => setIsEditing(true)}
						type="button"
						variant="link"
					>
						{props.volunteer.roleEmoji ?? "✨"} {props.volunteer.roleName ?? "Add role"}
					</Button>
				)}
				{isEditing && (
					<div className="mt-2 flex w-full items-center gap-2 p-1">
						<Popover onOpenChange={setIsEmojiPickerOpen} open={isEmojiPickerOpen}>
							<PopoverTrigger asChild>
								<Button
									aria-label={`Choose ${props.volunteer.name}'s role emoji`}
									size="icon-sm"
									type="button"
									variant="outline"
								>
									{roleEmoji || "✨"}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-fit p-0">
								<EmojiPicker
									className="h-86"
									onEmojiSelect={({ emoji }) => {
										setRoleEmoji(emoji)
										setIsEmojiPickerOpen(false)
									}}
								>
									<EmojiPickerSearch />
									<EmojiPickerContent />
									<EmojiPickerFooter />
								</EmojiPicker>
							</PopoverContent>
						</Popover>
						<Input
							aria-label={roleAriaLabel}
							className="min-w-0 flex-1"
							maxLength={100}
							onChange={(event) => setRoleName(event.target.value)}
							placeholder={rolePlaceholder}
							value={roleName}
						/>
						<Button disabled={updateRole.isPending} onClick={save} size="sm" type="button">
							<Localized str="planning.save" />
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
