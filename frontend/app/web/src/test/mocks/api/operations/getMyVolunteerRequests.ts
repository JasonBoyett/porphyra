/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer, mockDatabase } from "../database"

export const mockOperation: ApiClientTransport["getMyVolunteerRequests"] = async (input) => {
	const viewer = getMockViewer()
	return Object.values(mockDatabase.volunteerRequests)
		.filter((request) => {
			const membership = mockDatabase.teamMemberships[request.teamMembershipId]
			return (
				mockDatabase.churchMemberships[membership?.churchMembershipId]?.userId === viewer.id &&
				(input?.include_resolved || request.status === "pending")
			)
		})
		.map((request) => {
			const membership = mockDatabase.teamMemberships[request.teamMembershipId]
			const user =
				membership &&
				mockDatabase.users[mockDatabase.churchMemberships[membership.churchMembershipId]?.userId]
			if (!user) throw new Error(`Volunteer request "${request.id}" has no user.`)
			return { ...request, userId: user.id, name: user.name, email: user.email, avatarUrl: "" }
		})
}
