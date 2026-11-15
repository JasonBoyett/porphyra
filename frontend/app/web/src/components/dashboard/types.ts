import type { Dashboard } from "../../api/client"

export type DashboardProps = {
	churches: Dashboard["churches"]
	isError: boolean
	isLoading: boolean
	viewerName?: string
}
