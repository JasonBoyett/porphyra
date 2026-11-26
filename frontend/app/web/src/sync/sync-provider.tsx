import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react"
import type { QueryClient } from "@tanstack/react-query"

import type { ApiTag } from "../api/tags"
import { SyncManager } from "./sync-manager"

const syncManagerContext = createContext<SyncManager | null>(null)

export const SyncProvider = (
	props: PropsWithChildren<{
		accessToken: string | null
		enabled?: boolean
		onAuthorizationChanged?: (churchId: string, campusId?: string) => void
		queryClient: QueryClient
	}>,
) => {
	const [manager] = useState(() =>
		props.enabled === false
			? null
			: new SyncManager(props.queryClient, {
					accessToken: props.accessToken,
					apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
					onAuthorizationChanged: props.onAuthorizationChanged,
				}),
	)

	useEffect(() => manager?.updateAccessToken(props.accessToken), [manager, props.accessToken])
	useEffect(() => () => manager?.dispose(), [manager])

	return <syncManagerContext.Provider value={manager}>{props.children}</syncManagerContext.Provider>
}

export const useSyncTags = (tags: readonly ApiTag[]) => {
	const manager = useContext(syncManagerContext)

	useEffect(() => {
		if (manager === null || tags.length === 0) return
		manager.addTags(tags)
		return () => manager.removeTags(tags)
	}, [manager, tags])
}
