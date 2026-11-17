import { useState } from "react"
import { Check, X } from "lucide-react"

import { apiClient, type VolunteerRequest } from "@/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RequestInboxProps } from "./types"

export const RequestInbox = ({ accessToken, requests }: RequestInboxProps) => {
	const [respondedRequestIds, setRespondedRequestIds] = useState<string[]>([])
	const accept = apiClient.acceptVolunteerRequest.useMutation()
	const decline = apiClient.declineVolunteerRequest.useMutation()
	const pendingRequests = requests.filter(
		(request) => request.status === "pending" && !respondedRequestIds.includes(request.id),
	)
	const respond = (request: VolunteerRequest, response: "accept" | "decline") => {
		setRespondedRequestIds((ids) => [...ids, request.id])
		const mutation = response === "accept" ? accept : decline
		mutation.mutate(
			{ accessToken, eventTeamId: request.campusEventTeamId, requestId: request.id },
			{ onError: () => setRespondedRequestIds((ids) => ids.filter((id) => id !== request.id)) },
		)
	}

	if (pendingRequests.length === 0) {
		return (
			<p className="m-0 text-sm text-muted-foreground">
				You have no requests waiting for a response.
			</p>
		)
	}

	return (
		<div className="grid gap-4">
			{pendingRequests.map((request) => (
				<Card className="porphyra-card" key={request.id}>
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<CardTitle>{request.roleName ?? "Volunteer request"}</CardTitle>
							<CardDescription>Respond to this service request.</CardDescription>
						</div>
						<Badge
							className="bg-accent/20 text-accent-foreground hover:bg-accent/20"
							variant="secondary"
						>
							Response needed
						</Badge>
					</CardHeader>
					<CardContent className="flex flex-wrap items-center justify-between gap-4">
						<p className="m-0 text-sm text-muted-foreground">
							{request.roleEmoji ?? "✨"} {request.roleName ?? "Open role"}
						</p>
						<div className="flex gap-2">
							<Button
								disabled={accept.isPending || decline.isPending}
								onClick={() => respond(request, "decline")}
								size="sm"
								variant="outline"
							>
								<X data-icon="inline-start" />
								Decline
							</Button>
							<Button
								disabled={accept.isPending || decline.isPending}
								onClick={() => respond(request, "accept")}
								size="sm"
							>
								<Check data-icon="inline-start" />
								Accept
							</Button>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
