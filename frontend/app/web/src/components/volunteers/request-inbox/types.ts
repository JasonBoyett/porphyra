import type { VolunteerRequest } from "@/api/client"

export type RequestInboxProps = {
	accessToken: string
	requests: VolunteerRequest[]
}
