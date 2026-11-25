import type { VolunteerRequestWithActions } from "@/api/client"

export type RequestInboxProps = {
	accessToken: string
	requests: VolunteerRequestWithActions[]
}
