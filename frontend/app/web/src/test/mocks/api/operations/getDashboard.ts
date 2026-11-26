/**
 * This file was auto-generated from Porphyra OpenAPI operation IDs.
 * Edit this stub to provide mock behavior. Future API generation preserves edits.
 */

import type { ApiClientTransport } from "@/api/client-types"

import { getMockViewer, mockDatabase } from "../database"

const _avatarUrl = (style: string, seed: string): string =>
	`https://api.dicebear.com/10.x/${style}/svg?seed=${encodeURIComponent(seed)}`

export const mockOperation: ApiClientTransport["getDashboard"] = async () => {
	const viewer = getMockViewer()
	const churchIds = new Set(
		Object.values(mockDatabase.churchMemberships)
			.filter((membership) => membership.userId === viewer.id)
			.map((membership) => membership.churchId),
	)

	return {
		viewer: {
			id: viewer.id,
			avatarUrl: _avatarUrl("clay", viewer.authId),
			email: viewer.email,
			name: viewer.name,
		},
		churches: Object.values(mockDatabase.churches)
			.filter((church) => churchIds.has(church.id))
			.map((church) => ({
				id: church.id,
				avatarUrl: _avatarUrl("stack", church.name),
				name: church.name,
				description: church.description,
				campuses: Object.values(mockDatabase.campuses)
					.filter((campus) => campus.churchId === church.id)
					.sort((left, right) => left.name.localeCompare(right.name))
					.map((campus) => ({
						id: campus.id,
						name: campus.name,
						location: {
							...campus.location,
							addressLine2: campus.location.addressLine2 ?? null,
						},
					})),
				ministries: Object.values(mockDatabase.ministries)
					.filter((ministry) => ministry.churchId === church.id)
					.sort((left, right) => left.name.localeCompare(right.name))
					.map((ministry) => ({
						id: ministry.id,
						name: ministry.name,
						teams: Object.values(mockDatabase.teams)
							.filter((team) => team.ministryId === ministry.id)
							.sort((left, right) => left.name.localeCompare(right.name))
							.map((team) => ({ id: team.id, name: team.name })),
					})),
			})),
	}
}
