import type { Query, QueryClient } from "@tanstack/react-query"

import { isApiTag, type ApiTag } from "../api/tags"

type TaggedQueryMeta = { syncTags?: readonly ApiTag[] }
type SyncEvent = { type: "changed"; tags: ApiTag[] }
type SocketFactory = (url: string, protocols: string[]) => WebSocket
type TimerHandle = ReturnType<typeof setTimeout>

export type SyncManagerOptions = {
	accessToken: string | null
	apiUrl: string
	createSocket?: SocketFactory
	onConnectionError?: (error: unknown) => void
	reconnectDelayMs?: number
	schedule?: (callback: () => void, delay: number) => TimerHandle
	cancelSchedule?: (handle: TimerHandle) => void
}

const SYNC_PROTOCOL = "porphyra.sync.v1"
const TOKEN_PROTOCOL_PREFIX = "porphyra.jwt."

const tagsForQuery = (query: Query): readonly ApiTag[] =>
	(query.meta as TaggedQueryMeta | undefined)?.syncTags ?? []

const syncUrl = (apiUrl: string) => {
	const url = new URL(apiUrl)
	url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
	url.pathname = "/api/v1/sync"
	url.search = ""
	url.hash = ""
	return url.toString()
}

export class SyncManager {
	readonly #activeTags = new Map<ApiTag, number>()
	readonly #queryClient: QueryClient
	readonly #apiUrl: string
	readonly #createSocket: SocketFactory
	readonly #onConnectionError: (error: unknown) => void
	readonly #reconnectDelayMs: number
	readonly #schedule: (callback: () => void, delay: number) => TimerHandle
	readonly #cancelSchedule: (handle: TimerHandle) => void
	#accessToken: string | null
	#socket: WebSocket | undefined
	#reconnectTimer: TimerHandle | undefined
	#disposed = false
	#reportedConnectionError = false

	public constructor(queryClient: QueryClient, options: SyncManagerOptions) {
		this.#queryClient = queryClient
		this.#apiUrl = options.apiUrl
		this.#accessToken = options.accessToken
		this.#createSocket = options.createSocket ?? ((url, protocols) => new WebSocket(url, protocols))
		this.#onConnectionError =
			options.onConnectionError ??
			((error) => console.warn("Porphyra realtime sync could not connect.", error))
		this.#reconnectDelayMs = options.reconnectDelayMs ?? 1_000
		this.#schedule = options.schedule ?? ((callback, delay) => setTimeout(callback, delay))
		this.#cancelSchedule = options.cancelSchedule ?? ((handle) => clearTimeout(handle))
	}

	public addTags(tags: readonly ApiTag[]) {
		if (this.#disposed) return
		for (const tag of new Set(tags)) {
			this.#activeTags.set(tag, (this.#activeTags.get(tag) ?? 0) + 1)
		}
		this.#connect()
	}

	public removeTags(tags: readonly ApiTag[]) {
		for (const tag of new Set(tags)) {
			const count = this.#activeTags.get(tag) ?? 0
			if (count <= 1) this.#activeTags.delete(tag)
			else this.#activeTags.set(tag, count - 1)
		}
		if (this.#activeTags.size === 0) this.#disconnect()
	}

	public updateAccessToken(accessToken: string | null) {
		if (this.#accessToken === accessToken || this.#disposed) return
		this.#accessToken = accessToken
		this.#reportedConnectionError = false
		this.#disconnect()
		this.#connect()
	}

	public dispose() {
		if (this.#disposed) return
		this.#disposed = true
		this.#activeTags.clear()
		this.#disconnect()
	}

	#connect() {
		if (
			this.#disposed ||
			this.#socket !== undefined ||
			this.#reconnectTimer !== undefined ||
			this.#activeTags.size === 0 ||
			this.#accessToken === null
		) {
			return
		}

		let socket: WebSocket
		try {
			socket = this.#createSocket(syncUrl(this.#apiUrl), [
				SYNC_PROTOCOL,
				`${TOKEN_PROTOCOL_PREFIX}${this.#accessToken}`,
			])
		} catch (error) {
			if (!this.#reportedConnectionError) {
				this.#reportedConnectionError = true
				this.#onConnectionError(error)
			}
			this.#scheduleReconnect()
			return
		}
		this.#socket = socket
		socket.addEventListener("open", () => {
			if (this.#socket === socket) this.#invalidateTags([...this.#activeTags.keys()])
		})
		socket.addEventListener("message", (event) => this.#handleMessage(event))
		socket.addEventListener("close", () => {
			if (this.#socket !== socket) return
			this.#socket = undefined
			this.#scheduleReconnect()
		})
	}

	#scheduleReconnect() {
		if (
			this.#disposed ||
			this.#reconnectTimer !== undefined ||
			this.#activeTags.size === 0 ||
			this.#accessToken === null
		) {
			return
		}

		this.#reconnectTimer = this.#schedule(() => {
			this.#reconnectTimer = undefined
			this.#connect()
		}, this.#reconnectDelayMs)
	}

	#disconnect() {
		if (this.#reconnectTimer !== undefined) {
			this.#cancelSchedule(this.#reconnectTimer)
			this.#reconnectTimer = undefined
		}
		const socket = this.#socket
		this.#socket = undefined
		socket?.close()
	}

	#handleMessage(event: MessageEvent) {
		let message: unknown
		try {
			message = JSON.parse(String(event.data))
		} catch {
			return
		}
		if (this.#isSyncEvent(message)) this.#invalidateTags(message.tags)
	}

	#isSyncEvent(message: unknown): message is SyncEvent {
		if (typeof message !== "object" || message === null) return false
		const candidate = message as Partial<SyncEvent>
		const keys = Object.keys(message)
		return (
			keys.length === 2 &&
			keys.includes("type") &&
			keys.includes("tags") &&
			candidate.type === "changed" &&
			Array.isArray(candidate.tags) &&
			candidate.tags.every(isApiTag)
		)
	}

	#invalidateTags(tags: readonly ApiTag[]) {
		const changedTags = new Set(tags.filter((tag) => this.#activeTags.has(tag)))
		if (changedTags.size === 0) return
		void this.#queryClient.invalidateQueries({
			predicate: (query) => tagsForQuery(query).some((tag) => changedTags.has(tag)),
		})
	}
}
