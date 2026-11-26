/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["getAllChurchMemberships"] = async () => {
	const viewer = getMockViewer()

	return Object.values(mockDatabase.churchMemberships)
		.filter((membership) => membership.userId === viewer.id)
		.map((membership) => ({
			id: membership.id,
			user_id: membership.userId,
			church_id: membership.churchId,
		}))
}
