import { describe, expect, test } from "vitest"
import { apiOperations } from "@porphyra/frontend/api/operations"

import { mockApiClientTransport } from "../transport"

describe("mockApiClientTransport", () => {
	test("registers an implementation for every generated API operation", () => {
		expect(Object.keys(mockApiClientTransport).sort()).toEqual(Object.keys(apiOperations).sort())
	})

	test("runs implemented operations through the generated registry", async () => {
		await expect(mockApiClientTransport.health_health_get()).resolves.toEqual({
			service: "porphyra-api",
			status: "ok",
		})
	})
})
