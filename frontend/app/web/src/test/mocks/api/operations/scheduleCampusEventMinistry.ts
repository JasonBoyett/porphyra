/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockDatabase } from "../database"
import { requireChurchAccess } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["scheduleCampusEventMinistry"] = async (input) => {
	const event = mockDatabase.campusEvents[input.event_id]
	if (!event) throw new Error("Mock campus event was not found.")
	requireChurchAccess(event.churchId)
	const ministry = mockDatabase.ministries[input.ministryId]
	if (!ministry || ministry.churchId !== event.churchId)
		throw new Error("Mock ministry does not belong to the event church.")
	if (
		Object.values(mockDatabase.campusEventMinistries).some(
			(item) => item.campusEventId === event.id && item.ministryId === ministry.id,
		)
	)
		throw new Error("Mock ministry is already scheduled.")
	const id = `campus-event-ministry:${crypto.randomUUID()}`
	mockDatabase.campusEventMinistries[id] = { id, campusEventId: event.id, ministryId: ministry.id }
	return { id, ministryId: ministry.id }
}
