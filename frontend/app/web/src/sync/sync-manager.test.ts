import { describe, expect, test } from "vitest"
import { QueryClient } from "@tanstack/react-query"

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

const invalidated = (queryClient: QueryClient, key: string) =>
	queryClient.getQueryCache().find({ queryKey: [key] })?.state.isInvalidated

const setup = (apiUrl = "http://localhost:8000") => {
	const queryClient = new QueryClient()
	const sockets: FakeSocket[] = []
	const connections: Array<{ protocols: string[]; url: string }> = []
	const scheduled: Array<() => void> = []
	const manager = new SyncManager(queryClient, {
		accessToken: "header.payload.signature",
		apiUrl,
		createSocket: (url, protocols) => {
			const socket = new FakeSocket()
			sockets.push(socket)
			connections.push({ protocols, url })
			return socket as unknown as WebSocket
		},
		schedule: (callback) => {
			scheduled.push(callback)
			return scheduled.length as unknown as ReturnType<typeof setTimeout>
		},
		cancelSchedule: () => undefined,
	})
	return { connections, manager, queryClient, scheduled, sockets }
}

describe("SyncManager", () => {
	test("is lazy, reference-counts tags, and keeps one authenticated socket", async () => {
		const { connections, manager, queryClient, sockets } = setup()
		await addQuery(queryClient, "planning", [apiTag.campusEvents])
		expect(sockets).toHaveLength(0)

		manager.addTags([apiTag.campusEvents])
		manager.addTags([apiTag.campusEvents])
		expect(sockets).toHaveLength(1)
		expect(connections[0]).toEqual({
			url: "ws://localhost:8000/api/v1/sync",
			protocols: ["porphyra.sync.v1", "porphyra.jwt.header.payload.signature"],
		})

		manager.removeTags([apiTag.campusEvents])
		sockets[0].emit("message", JSON.stringify({ type: "changed", tags: ["campus-events"] }))
		expect(invalidated(queryClient, "planning")).toBe(true)
		manager.removeTags([apiTag.campusEvents])
		expect(sockets[0].closed).toBe(true)
	})

	test("invalidates matching and shared concerns but not unrelated queries", async () => {
		const { manager, queryClient, sockets } = setup()
		await addQuery(queryClient, "list", [apiTag.campusEvents])
		await addQuery(queryClient, "detail", [apiTag.campusEvents, apiTag.campusEventPlanning])
		await addQuery(queryClient, "dashboard", [apiTag.dashboard])
		manager.addTags([apiTag.campusEvents, apiTag.campusEventPlanning])

		sockets[0].emit("message", JSON.stringify({ type: "changed", tags: ["campus-events"] }))

		expect(invalidated(queryClient, "list")).toBe(true)
		expect(invalidated(queryClient, "detail")).toBe(true)
		expect(invalidated(queryClient, "dashboard")).toBe(false)
	})

	test("ignores malformed, unknown, and non-JSON events", async () => {
		const { manager, queryClient, sockets } = setup()
		await addQuery(queryClient, "dashboard", [apiTag.dashboard])
		manager.addTags([apiTag.dashboard])

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
		const { connections, manager, queryClient, scheduled, sockets } = setup(
			"https://api.example.test/base?debug=true",
		)
		await addQuery(queryClient, "dashboard", [apiTag.dashboard])
		manager.addTags([apiTag.dashboard])
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

	test("dispose closes the socket and prevents reconnect", () => {
		const { manager, scheduled, sockets } = setup()
		manager.addTags([apiTag.dashboard])
		manager.dispose()
		expect(sockets[0].closed).toBe(true)
		sockets[0].emit("close")
		expect(scheduled).toHaveLength(0)
		manager.addTags([apiTag.dashboard])
		expect(sockets).toHaveLength(1)
	})
})
