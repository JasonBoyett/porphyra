/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { requireChurchAccess } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["createChurchEvent"] = async (input) => {
	requireChurchAccess(input.churchId)
	// Church events currently have no shared mock-database relation or read operation.
	// The response mirrors the server's newly-created event representation.
	return {
		id: `church-event:${crypto.randomUUID()}`,
		churchId: input.churchId,
		title: input.title,
		description: input.description,
		startsAt: input.startsAt,
		endsAt: input.endsAt ?? null,
		isStaffed: false,
		isFullyStaffed: true,
		teamsNeedingConfirmation: [],
	}
}
