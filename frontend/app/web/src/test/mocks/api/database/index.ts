/**
 * Relational state for generated API operation mocks.
 *
 * `mockDatabase` is deliberately mutable so an operation stub or test can set
 * up a scenario. Call `resetMockDatabase()` between scenarios; it restores a
 * structured clone of the seed-derived baseline and the development viewer.
 * Use `setMockViewer()` with a seeded user's stable id or email to switch the
 * authenticated user. These records are mock-internal, not API response DTOs.
 */
import seedJson from "../../../../../../../../server/api/app/seed/data.json"

import type {
	MockCampus,
	MockChurch,
	MockDatabase,
	MockId,
	MockUser,
	MockVolunteerRequestStatus,
} from "./types"

export type * from "./types"

type SeedTeam = {
	name: string
	callTime: string | null
	notes: string[]
	roles: Record<string, { emoji: string; count: number }>
	volunteerRequests?: SeedVolunteerRequest[]
}
type SeedVolunteerRequest = {
	id: string
	volunteer: string
	role: string
	status: MockVolunteerRequestStatus
	replaces?: string
}
type SeedMinistry = { name: string; teams: string[] }
type SeedEventMinistry = { name: string; teams: SeedTeam[] }
type SeedCampusEvent = {
	title: string
	description: string
	campus: string
	startsAt: string
	endsAt: string
	ministries: SeedEventMinistry[]
}
type SeedChurch = {
	name: string
	description: string
	campuses: Array<{ name: string; location: MockCampus["location"] }>
	ministries: SeedMinistry[]
	volunteers: string[]
	campusEvents?: SeedCampusEvent[]
}
type SeedData = { developmentUser: Omit<MockUser, "id">; churches: SeedChurch[] }

const seedData = seedJson as SeedData

const recordId = (kind: string, ...parts: string[]): MockId =>
	`${kind}:${parts.map(slug).join(":")}`
const slug = (value: string): string =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "")

const emptyDatabase = (): MockDatabase => ({
	users: {},
	churches: {},
	campuses: {},
	ministries: {},
	teams: {},
	churchMemberships: {},
	teamMemberships: {},
	ministryLeaderships: {},
	campusEvents: {},
	campusEventMinistries: {},
	campusEventTeams: {},
	campusEventTeamVolunteers: {},
	volunteerRequests: {},
})

function buildInitialMockDatabase(data: SeedData): MockDatabase {
	const database = emptyDatabase()
	const developmentUserId = recordId("user", data.developmentUser.authId)
	database.users[developmentUserId] = { id: developmentUserId, ...data.developmentUser }

	for (const churchData of data.churches) {
		const churchId = recordId("church", churchData.name)
		database.churches[churchId] = {
			id: churchId,
			name: churchData.name,
			description: churchData.description,
		}
		const developmentMembershipId = recordId("church-membership", developmentUserId, churchId)
		database.churchMemberships[developmentMembershipId] = {
			id: developmentMembershipId,
			userId: developmentUserId,
			churchId,
		}

		for (const campusData of churchData.campuses) {
			const id = recordId("campus", churchId, campusData.name)
			database.campuses[id] = { id, churchId, name: campusData.name, location: campusData.location }
		}

		const teams = churchData.ministries
			.flatMap((ministryData) => {
				const ministryId = recordId("ministry", churchId, ministryData.name)
				database.ministries[ministryId] = { id: ministryId, churchId, name: ministryData.name }
				const leadershipId = recordId("ministry-leadership", developmentMembershipId, ministryId)
				database.ministryLeaderships[leadershipId] = {
					id: leadershipId,
					churchMembershipId: developmentMembershipId,
					ministryId,
				}
				return ministryData.teams.map((teamName) => {
					const id = recordId("team", ministryId, teamName)
					database.teams[id] = { id, ministryId, name: teamName }
					const membershipId = recordId("team-membership", developmentMembershipId, id)
					database.teamMemberships[membershipId] = {
						id: membershipId,
						churchMembershipId: developmentMembershipId,
						teamId: id,
						notes: [],
					}
					return database.teams[id]
				})
			})
			.sort((left, right) => {
				const leftMinistry = database.ministries[left.ministryId]
				const rightMinistry = database.ministries[right.ministryId]
				return (
					leftMinistry.name.localeCompare(rightMinistry.name) || left.name.localeCompare(right.name)
				)
			})

		const volunteerIdsByName = new Map<string, MockId>()
		churchData.volunteers.forEach((name, index) => {
			const volunteerId = recordId("user", churchId, name)
			const volunteerSlug = slug(name)
			database.users[volunteerId] = {
				id: volunteerId,
				authId: `seed:${slug(churchData.name)}:${volunteerSlug}`,
				email: `${volunteerSlug}@${slug(churchData.name)}.test`,
				name,
			}
			volunteerIdsByName.set(name, volunteerId)
			const churchMembershipId = recordId("church-membership", volunteerId, churchId)
			database.churchMemberships[churchMembershipId] = {
				id: churchMembershipId,
				userId: volunteerId,
				churchId,
			}
			const teamIndexes = [index % teams.length]
			if (index % 5 === 0 && teams.length > 1) teamIndexes.push((index + 1) % teams.length)
			for (const teamIndex of teamIndexes) {
				const teamId = teams[teamIndex].id
				const id = recordId("team-membership", churchMembershipId, teamId)
				database.teamMemberships[id] = { id, churchMembershipId, teamId, notes: [] }
			}
		})

		for (const eventData of churchData.campusEvents ?? []) {
			const campus = Object.values(database.campuses).find(
				(candidate) => candidate.churchId === churchId && candidate.name === eventData.campus,
			)
			if (!campus)
				throw new Error(
					`Seed event ${eventData.title} references unknown campus ${eventData.campus}.`,
				)
			const eventId = recordId("campus-event", campus.id, eventData.title)
			database.campusEvents[eventId] = {
				id: eventId,
				churchId,
				campusId: campus.id,
				title: eventData.title,
				description: eventData.description,
				startsAt: eventData.startsAt,
				endsAt: eventData.endsAt,
			}
			for (const eventMinistryData of eventData.ministries) {
				const ministry = Object.values(database.ministries).find(
					(candidate) =>
						candidate.churchId === churchId && candidate.name === eventMinistryData.name,
				)
				if (!ministry)
					throw new Error(
						`Seed event ${eventData.title} references unknown ministry ${eventMinistryData.name}.`,
					)
				const eventMinistryId = recordId("campus-event-ministry", eventId, ministry.id)
				database.campusEventMinistries[eventMinistryId] = {
					id: eventMinistryId,
					campusEventId: eventId,
					ministryId: ministry.id,
				}
				for (const eventTeamData of eventMinistryData.teams) {
					const team = Object.values(database.teams).find(
						(candidate) =>
							candidate.ministryId === ministry.id && candidate.name === eventTeamData.name,
					)
					if (!team)
						throw new Error(
							`Seed event ${eventData.title} references unknown team ${eventTeamData.name}.`,
						)
					const eventTeamId = recordId("campus-event-team", eventMinistryId, team.id)
					database.campusEventTeams[eventTeamId] = {
						id: eventTeamId,
						campusEventMinistryId: eventMinistryId,
						teamId: team.id,
						callTime: eventTeamData.callTime,
						notes: eventTeamData.notes,
						roleRequirements: eventTeamData.roles,
					}
					const requestIds = new Map<string, MockId>()
					for (const requestData of eventTeamData.volunteerRequests ?? []) {
						const volunteerId = volunteerIdsByName.get(requestData.volunteer)
						if (!volunteerId)
							throw new Error(`Seed request references unknown volunteer ${requestData.volunteer}.`)
						const churchMembership = Object.values(database.churchMemberships).find(
							(candidate) => candidate.userId === volunteerId && candidate.churchId === churchId,
						)
						const teamMembership = Object.values(database.teamMemberships).find(
							(candidate) =>
								candidate.churchMembershipId === churchMembership?.id &&
								candidate.teamId === team.id,
						)
						if (!teamMembership)
							throw new Error(
								`Seed request volunteer ${requestData.volunteer} is not on ${team.name}.`,
							)
						const id = recordId("volunteer-request", eventTeamId, requestData.id)
						const role = eventTeamData.roles[requestData.role]
						if (!role) throw new Error(`Seed request references unknown role ${requestData.role}.`)
						database.volunteerRequests[id] = {
							id,
							campusEventTeamId: eventTeamId,
							teamMembershipId: teamMembership.id,
							roleName: requestData.role,
							roleEmoji: role.emoji,
							status: requestData.status,
							replacingId: requestData.replaces
								? (requestIds.get(requestData.replaces) ?? null)
								: null,
						}
						requestIds.set(requestData.id, id)
					}
				}
			}
		}
	}
	return database
}

const initialMockDatabase = buildInitialMockDatabase(seedData)
const developmentUserId = recordId("user", seedData.developmentUser.authId)

/** Mutable relational state for mock operation implementations and test setup. */
export const mockDatabase: MockDatabase = structuredClone(initialMockDatabase)

let viewerId = developmentUserId

/** Restore seed-derived records and select Porphyra's development user. */
export function resetMockDatabase(): void {
	const reset = structuredClone(initialMockDatabase)
	Object.assign(mockDatabase, reset)
	viewerId = developmentUserId
}

/** Find a user by the stable mock record id or seeded email address. */
export function findMockUser(idOrEmail: string): MockUser | undefined {
	return (
		mockDatabase.users[idOrEmail] ??
		Object.values(mockDatabase.users).find((user) => user.email === idOrEmail)
	)
}

/** Return a user or fail with a setup error that names the missing identifier. */
export function getMockUser(idOrEmail: string): MockUser {
	const user = findMockUser(idOrEmail)
	if (!user) throw new Error(`No mock user exists for "${idOrEmail}".`)
	return user
}

/** Select the current viewer by stable mock user id or seeded email. */
export function setMockViewer(idOrEmail: string): MockUser {
	const user = getMockUser(idOrEmail)
	viewerId = user.id
	return user
}

/** Return the selected viewer. The default is Porphyra's development user. */
export function getMockViewer(): MockUser {
	return getMockUser(viewerId)
}

export function findMockChurchByName(name: string): MockChurch | undefined {
	return Object.values(mockDatabase.churches).find((church) => church.name === name)
}

export function findMockCampus(churchId: MockId, name: string): MockCampus | undefined {
	return Object.values(mockDatabase.campuses).find(
		(campus) => campus.churchId === churchId && campus.name === name,
	)
}
