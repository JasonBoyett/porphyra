import { describe, expect, it } from "vitest"

import { consumeSyncCallKey, createSyncCallKey, markSyncCallReconciled } from "./call-keys"

describe("sync call keys", () => {
	it("suppresses an echo after local reconciliation", () => {
		const callKey = createSyncCallKey("planning-query")
		markSyncCallReconciled(callKey, "planning-query")

		expect(consumeSyncCallKey(callKey)).toBe(true)
		expect(consumeSyncCallKey(callKey)).toBe(false)
	})

	it("consumes an early echo without suppressing it", () => {
		const callKey = createSyncCallKey("planning-query")

		expect(consumeSyncCallKey(callKey)).toBe(false)
		markSyncCallReconciled(callKey, "planning-query")
		expect(consumeSyncCallKey(callKey)).toBe(false)
	})
})
