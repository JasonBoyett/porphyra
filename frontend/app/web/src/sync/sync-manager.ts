import type { Query, QueryClient } from "@tanstack/react-query"

import type { ApiTag } from "../api/tags"

type TaggedQueryMeta = { syncTags?: readonly ApiTag[] }

const tagsForQuery = (query: Query): readonly ApiTag[] =>
	(query.meta as TaggedQueryMeta | undefined)?.syncTags ?? []

export class SyncManager {
	private readonly _activeTags = new Map<ApiTag, number>()

	public constructor(private readonly _queryClient: QueryClient) {}

	public addTags(tags: readonly ApiTag[]) {
		for (const tag of tags) {
			this._activeTags.set(tag, (this._activeTags.get(tag) ?? 0) + 1)
		}
	}

	public removeTags(tags: readonly ApiTag[]) {
		for (const tag of tags) {
			const count = this._activeTags.get(tag) ?? 0
			if (count <= 1) this._activeTags.delete(tag)
			else this._activeTags.set(tag, count - 1)
		}
	}

	/** Invalidate active queries affected by a future socket change event. */
	public invalidateTags(tags: readonly ApiTag[]) {
		const changedTags = new Set(tags.filter((tag) => this._activeTags.has(tag)))
		if (changedTags.size === 0) return

		void this._queryClient.invalidateQueries({
			predicate: (query) => tagsForQuery(query).some((tag) => changedTags.has(tag)),
		})
	}
}
