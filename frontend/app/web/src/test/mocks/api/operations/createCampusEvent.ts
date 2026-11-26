/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"
import { mockDatabase } from "../database"
import { planningResponse, requireChurchAccess } from "./getCampusEventPlanning"

export const mockOperation: ApiClientTransport["createCampusEvent"] = async (input) => {
	requireChurchAccess(input.churchId)
	const campus = mockDatabase.campuses[input.campusId]
	if (!campus || campus.churchId !== input.churchId)
		throw new Error("Mock campus does not belong to the church.")
	const id = `campus-event:${crypto.randomUUID()}`
	mockDatabase.campusEvents[id] = {
		id,
		churchId: input.churchId,
		campusId: input.campusId,
		title: input.title,
		description: input.description,
		startsAt: input.startsAt,
		endsAt: input.endsAt ?? null,
	}
	const planning = planningResponse(id)
	return {
		id,
		churchId: input.churchId,
		campusId: input.campusId,
		campusLocation: planning.campusLocation,
		title: input.title,
		description: input.description,
		startsAt: input.startsAt,
		endsAt: input.endsAt ?? null,
		isStaffed: false,
		isFullyStaffed: true,
		teamsNeedingConfirmation: [],
	}
}
