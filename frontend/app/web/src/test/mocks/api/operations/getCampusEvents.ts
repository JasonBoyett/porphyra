/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { getMockViewer, mockDatabase } from "../database"
import { planningResponse } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["getCampusEvents"] = async () => {
	const viewer = getMockViewer()
	return Object.values(mockDatabase.campusEvents)
		.filter((event) =>
			Object.values(mockDatabase.churchMemberships).some(
				(m) => m.userId === viewer.id && m.churchId === event.churchId,
			),
		)
		.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
		.map((event) => {
			const planning = planningResponse(event.id)
			return {
				id: event.id,
				churchId: event.churchId,
				churchName: planning.churchName,
				campusId: event.campusId,
				campusName: planning.campusName,
				campusLocation: planning.campusLocation,
				title: event.title,
				startsAt: event.startsAt,
				endsAt: event.endsAt,
				isStaffed: planning.isStaffed,
				isFullyStaffed: planning.isFullyStaffed,
			}
		})
}
