import { useState } from "react"
import { Check, X } from "lucide-react"
import { toast } from "sonner"

import type { VolunteerRequestWithActions } from "@/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	ComputedText,
	Localized,
	LocalizationScope,
	useSimpleLocalizedString,
} from "@/localization"
import type { RequestInboxProps } from "./types"

export const RequestInbox = ({ accessToken, requests }: RequestInboxProps) => {
	const [respondedRequestIds, setRespondedRequestIds] = useState<string[]>([])
	const requestResponseFailed = useSimpleLocalizedString("volunteers.requestResponseFailed")
	const pendingRequests = requests.filter((request) => !respondedRequestIds.includes(request.id))
	const respond = async (request: VolunteerRequestWithActions, response: "accept" | "decline") => {
		setRespondedRequestIds((ids) => [...ids, request.id])
		try {
			await request[response]()
		} catch {
			setRespondedRequestIds((ids) => ids.filter((id) => id !== request.id))
			toast.error(requestResponseFailed)
		}
	}

	if (pendingRequests.length === 0) {
		return (
			<LocalizationScope name="volunteers.empty-request-inbox">
				<Localized asChild str="volunteers.noRequestsWaiting">
					<p className="m-0 text-sm text-muted-foreground" />
				</Localized>
			</LocalizationScope>
		)
	}

	return (
		<div className="grid gap-4">
			{pendingRequests.map((request) => (
				<LocalizationScope key={request.id} name="volunteers.request-card">
					<Card className="porphyra-card">
						<CardHeader className="flex flex-row items-start justify-between gap-4">
							<div>
								<CardTitle>
									{request.roleName === null ? (
										<Localized str="volunteers.volunteerRequest" />
									) : (
										<ComputedText value={request.roleName} />
									)}
								</CardTitle>
								<CardDescription>
									<LocalizationScope name="volunteers.request-description">
										<Localized str="volunteers.respondToServiceRequest" />
									</LocalizationScope>
								</CardDescription>
							</div>
							<Badge
								className="bg-accent/20 text-accent-foreground hover:bg-accent/20"
								variant="secondary"
							>
								<LocalizationScope name="volunteers.request-response-needed">
									<Localized str="volunteers.responseNeeded" />
								</LocalizationScope>
							</Badge>
						</CardHeader>
						<CardContent className="flex flex-wrap items-center justify-between gap-4">
							<p className="m-0 text-sm text-muted-foreground">
								<ComputedText value={request.roleEmoji ?? "✨"} />{" "}
								{request.roleName === null ? (
									<Localized str="volunteers.openRole" />
								) : (
									<ComputedText value={request.roleName} />
								)}
							</p>
							<div className="flex gap-2">
								<Button
									disabled={respondedRequestIds.includes(request.id)}
									onClick={() => respond(request, "decline")}
									size="sm"
									variant="outline"
								>
									<X data-icon="inline-start" />
									<LocalizationScope name="volunteers.request-decline">
										<Localized str="volunteers.decline" />
									</LocalizationScope>
								</Button>
								<Button
									disabled={respondedRequestIds.includes(request.id)}
									onClick={() => respond(request, "accept")}
									size="sm"
								>
									<Check data-icon="inline-start" />
									<LocalizationScope name="volunteers.request-accept">
										<Localized str="planning.volunteerAccepted" />
									</LocalizationScope>
								</Button>
							</div>
						</CardContent>
					</Card>
				</LocalizationScope>
			))}
		</div>
	)
}
