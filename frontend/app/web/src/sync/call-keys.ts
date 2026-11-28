type PendingCall = {
	queryContext: string | undefined
	locallyReconciled: boolean
}

const pendingCallKeys = new Map<string, PendingCall>()

export const createSyncCallKey = (queryContext?: string) => {
	const callKey = crypto.randomUUID()
	pendingCallKeys.set(callKey, { queryContext, locallyReconciled: false })
	return callKey
}

export const forgetSyncCallKey = (callKey: string) => pendingCallKeys.delete(callKey)

export const markSyncCallReconciled = (callKey: string, queryContext: string) => {
	const pending = pendingCallKeys.get(callKey)
	if (pending?.queryContext !== queryContext) return
	pending.locallyReconciled = true
}

export const consumeSyncCallKey = (callKey: string) => {
	const pending = pendingCallKeys.get(callKey)
	pendingCallKeys.delete(callKey)
	return pending?.locallyReconciled === true
}
