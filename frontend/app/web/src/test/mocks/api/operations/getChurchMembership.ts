/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["getChurchMembership"] = async ({ church_id }) => {
	const viewer = getMockViewer()
	const membership = Object.values(mockDatabase.churchMemberships).find(
		(candidate) => candidate.userId === viewer.id && candidate.churchId === church_id,
	)

	if (!membership) throw new Error(`Church membership for "${church_id}" was not found.`)

	return {
		id: membership.id,
		user_id: membership.userId,
		church_id: membership.churchId,
	}
}
