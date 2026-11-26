/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer } from "../database"

export const mockOperation: ApiClientTransport["getCurrentUser"] = async () => {
	const viewer = getMockViewer()

	return {
		id: viewer.id,
		name: viewer.name,
		email: viewer.email,
		auth_id: viewer.authId,
	}
}
