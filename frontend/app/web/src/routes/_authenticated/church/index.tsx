import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { ChurchOnboarding } from "@/components/church-onboarding"
import type { CreateChurchInput } from "@/components/church-onboarding/types"

export const Route = createFileRoute("/_authenticated/church/")({
	component: ChurchEntryRoute,
})

function ChurchEntryRoute() {
	const { apiClient } = Route.useRouteContext()
	const navigate = useNavigate({ from: "/church/" })
	const createChurch = apiClient.createChurch.useMutation()

	const handleSubmit = async (input: CreateChurchInput) => {
		const church = await createChurch.mutateAsync(input)
		await navigate({ params: { churchId: church.id }, to: "/church/$churchId" })
		return church
	}

	return <ChurchOnboarding isPending={createChurch.isPending} onSubmit={handleSubmit} />
}
