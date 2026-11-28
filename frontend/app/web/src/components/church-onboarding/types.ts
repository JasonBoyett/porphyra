import type { ApiOperationInput, ApiOperationResponse } from "@porphyra/frontend/api/types"

export type CreateChurchInput = ApiOperationInput<"createChurch">
export type CreateChurchResponse = ApiOperationResponse<"createChurch">
export type ChurchOnboardingCampus = CreateChurchInput["campuses"][number]

export type ChurchOnboardingProps = {
	isPending: boolean
	onSubmit: (input: CreateChurchInput) => Promise<CreateChurchResponse>
}
