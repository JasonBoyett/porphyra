import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react"
import type { QueryClient } from "@tanstack/react-query"

import type { ApiTag } from "../api/tags"
import { SyncManager } from "./sync-manager"

const syncManagerContext = createContext<SyncManager | null>(null)

export const SyncProvider = (props: PropsWithChildren<{ queryClient: QueryClient }>) => {
	const [manager] = useState(() => new SyncManager(props.queryClient))

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
