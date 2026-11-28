import { describe, expect, test } from "vitest"
import { QueryClient, QueryObserver } from "@tanstack/react-query"

import { apiTag, type ApiTag } from "../api/tags"
import { SyncManager } from "./sync-manager"

type Listener = (event: Event | MessageEvent) => void

class FakeSocket {
	public readonly listeners = new Map<string, Listener[]>()
	public closed = false

	public addEventListener(type: string, listener: Listener) {
		this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
	}

	public close() {
		this.closed = true
	}

	public emit(type: string, data?: unknown) {
		const event = type === "message" ? ({ data } as MessageEvent) : ({} as Event)
		for (const listener of this.listeners.get(type) ?? []) listener(event)
	}
}

const addQuery = async (queryClient: QueryClient, key: string, tags: readonly ApiTag[]) => {
	await queryClient.fetchQuery({
		queryKey: [key],
		queryFn: () => key,
		meta: { syncTags: tags },
		staleTime: Infinity,
	})
}

const observeQuery = (queryClient: QueryClient, key: string, tags: readonly ApiTag[]) => {
	const observer = new QueryObserver(queryClient, {
		queryKey: [key],
		queryFn: () => key,
		meta: { syncTags: tags },
		staleTime: Infinity,
	})
	return observer.subscribe(() => undefined)
}

const invalidated = (queryClient: QueryClient, key: string) =>
	queryClient.getQueryCache().find({ queryKey: [key] })?.state.isInvalidated

const setup = (apiUrl = "http://localhost:8000") => {
	const queryClient = new QueryClient()
	const sockets: FakeSocket[] = []
	const connections: Array<{ protocols: string[]; url: string }> = []
	const scheduled: Array<() => void> = []
	const manager = new SyncManager(queryClient, {
		apiUrl,
		createSocket: (url, protocols) => {
			const socket = new FakeSocket()
			sockets.push(socket)
			connections.push({ protocols, url })
			return socket as unknown as WebSocket
		},
		getAccessToken: () => "header.payload.signature",
		schedule: (callback) => {
			scheduled.push(callback)
			return scheduled.length as unknown as ReturnType<typeof setTimeout>
		},
		cancelSchedule: () => undefined,
	})
	return { connections, manager, queryClient, scheduled, sockets }
}

describe("SyncManager", () => {
	test("derives active concerns from query observers and keeps one authenticated socket", async () => {
		const { connections, queryClient, sockets } = setup()
		await addQuery(queryClient, "planning", [apiTag.campusEvents])
		expect(sockets).toHaveLength(0)

		const stopFirstObserver = observeQuery(queryClient, "planning", [apiTag.campusEvents])
		const stopSecondObserver = observeQuery(queryClient, "planning", [apiTag.campusEvents])
		expect(sockets).toHaveLength(1)
		expect(connections[0]).toEqual({
			url: "ws://localhost:8000/api/v1/sync",
			protocols: ["porphyra.sync.v1", "porphyra.jwt.header.payload.signature"],
		})

		stopFirstObserver()
		sockets[0].emit("message", JSON.stringify({ type: "changed", tags: ["campus-events"] }))
		expect(invalidated(queryClient, "planning")).toBe(true)
		stopSecondObserver()
		expect(sockets[0].closed).toBe(true)
	})

	test("invalidates matching and shared concerns but not unrelated queries", async () => {
		const { queryClient, sockets } = setup()
		await addQuery(queryClient, "list", [apiTag.campusEvents])
		await addQuery(queryClient, "detail", [apiTag.campusEvents, apiTag.campusEventPlanning])
		await addQuery(queryClient, "dashboard", [apiTag.dashboard])
		observeQuery(queryClient, "list", [apiTag.campusEvents])
		observeQuery(queryClient, "detail", [apiTag.campusEvents, apiTag.campusEventPlanning])
		observeQuery(queryClient, "dashboard", [apiTag.dashboard])

		sockets[0].emit("message", JSON.stringify({ type: "changed", tags: ["campus-events"] }))

		expect(invalidated(queryClient, "list")).toBe(true)
		expect(invalidated(queryClient, "detail")).toBe(true)
		expect(invalidated(queryClient, "dashboard")).toBe(false)
	})

	test("only invalidates the tab with an active matching concern", async () => {
		const firstTab = setup()
		const secondTab = setup()
		await addQuery(firstTab.queryClient, "dashboard", [apiTag.dashboard])
		await addQuery(secondTab.queryClient, "planning", [apiTag.campusEvents])
		observeQuery(firstTab.queryClient, "dashboard", [apiTag.dashboard])
		observeQuery(secondTab.queryClient, "planning", [apiTag.campusEvents])

		firstTab.sockets[0].emit(
			"message",
			JSON.stringify({ type: "changed", tags: [apiTag.campusEvents] }),
		)
		secondTab.sockets[0].emit(
			"message",
			JSON.stringify({ type: "changed", tags: [apiTag.campusEvents] }),
		)

		expect(invalidated(firstTab.queryClient, "dashboard")).toBe(false)
		expect(invalidated(secondTab.queryClient, "planning")).toBe(true)
	})

	test("ignores malformed, unknown, and non-JSON events", async () => {
		const { queryClient, sockets } = setup()
		await addQuery(queryClient, "dashboard", [apiTag.dashboard])
		observeQuery(queryClient, "dashboard", [apiTag.dashboard])

		for (const event of [
			"not-json",
			JSON.stringify({ type: "changed", tags: "dashboard" }),
			JSON.stringify({ type: "changed", tags: ["church-secret-123"] }),
			JSON.stringify({ type: "changed", tags: ["dashboard"], records: [] }),
			JSON.stringify({ type: "records", tags: ["dashboard"] }),
		]) {
			sockets[0].emit("message", event)
		}
		expect(invalidated(queryClient, "dashboard")).toBe(false)
	})

	test("uses wss for HTTPS and reconnects with active invalidation", async () => {
		const { connections, queryClient, scheduled, sockets } = setup(
			"https://api.example.test/base?debug=true",
		)
		await addQuery(queryClient, "dashboard", [apiTag.dashboard])
		observeQuery(queryClient, "dashboard", [apiTag.dashboard])
		expect(connections[0].url).toBe("wss://api.example.test/api/v1/sync")

		sockets[0].emit("open")
		expect(invalidated(queryClient, "dashboard")).toBe(true)
		await queryClient.resetQueries({ queryKey: ["dashboard"] })
		sockets[0].emit("close")
		expect(scheduled).toHaveLength(1)
		scheduled[0]()
		expect(sockets).toHaveLength(2)
		sockets[1].emit("open")
		expect(invalidated(queryClient, "dashboard")).toBe(true)
	})

	test("keeps a synchronous socket construction failure from crashing the application", () => {
		const queryClient = new QueryClient()
		const scheduled: Array<() => void> = []
		const connectionErrors: unknown[] = []
		let attempts = 0
		const connectionError = new DOMException("Invalid WebSocket protocol")
		const manager = new SyncManager(queryClient, {
			apiUrl: "http://localhost:8000",
			createSocket: () => {
				attempts += 1
				throw connectionError
			},
			getAccessToken: () => "browser-rejected-token",
			onConnectionError: (error) => connectionErrors.push(error),
			schedule: (callback) => {
				scheduled.push(callback)
				return scheduled.length as unknown as ReturnType<typeof setTimeout>
			},
			cancelSchedule: () => undefined,
		})

		expect(() => observeQuery(queryClient, "dashboard", [apiTag.dashboard])).not.toThrow()
		expect(attempts).toBe(1)
		expect(connectionErrors).toEqual([connectionError])
		expect(scheduled).toHaveLength(1)

		scheduled[0]()
		expect(attempts).toBe(2)
		expect(connectionErrors).toEqual([connectionError])
		expect(scheduled).toHaveLength(2)
	})

	test("dispose closes the socket and prevents reconnect", () => {
		const { manager, queryClient, scheduled, sockets } = setup()
		observeQuery(queryClient, "dashboard", [apiTag.dashboard])
		manager.dispose()
		expect(sockets[0].closed).toBe(true)
		sockets[0].emit("close")
		expect(scheduled).toHaveLength(0)
		observeQuery(queryClient, "second-dashboard", [apiTag.dashboard])
		expect(sockets).toHaveLength(1)
	})
})
