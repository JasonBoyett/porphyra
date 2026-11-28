import type { DashboardChurchResponse } from "@porphyra/frontend/api/types"

export type ChurchWorkspaceChurch = DashboardChurchResponse

export type ChurchWorkspaceProps = {
	church?: ChurchWorkspaceChurch
	isError: boolean
	isLoading: boolean
}
