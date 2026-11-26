export type MockId = string

export type MockUser = {
	id: MockId
	authId: string
	email: string
	name: string
}

export type MockChurch = { id: MockId; name: string; description: string }

export type MockCampus = {
	id: MockId
	churchId: MockId
	name: string
	location: {
		addressLine1: string
		addressLine2?: string
		city: string
		region: string
		postalCode: string
		countryCode: string
		timeZone: string
	}
}

export type MockMinistry = { id: MockId; churchId: MockId; name: string }
export type MockTeam = { id: MockId; ministryId: MockId; name: string }

export type MockChurchMembership = { id: MockId; userId: MockId; churchId: MockId }
export type MockTeamMembership = {
	id: MockId
	churchMembershipId: MockId
	teamId: MockId
	notes: string[]
}
export type MockMinistryLeadership = { id: MockId; churchMembershipId: MockId; ministryId: MockId }

export type MockCampusEvent = {
	id: MockId
	churchId: MockId
	campusId: MockId
	title: string
	description: string
	startsAt: string
	endsAt: string | null
}
export type MockCampusEventMinistry = {
	id: MockId
	campusEventId: MockId
	ministryId: MockId
}
export type MockRoleRequirement = { emoji: string; count: number }
export type MockCampusEventTeam = {
	id: MockId
	campusEventMinistryId: MockId
	teamId: MockId
	callTime: string | null
	notes: string[]
	roleRequirements: Record<string, MockRoleRequirement>
	confirmedAt?: string | null
	confirmedByTeamMembershipId?: MockId | null
}
export type MockCampusEventTeamVolunteer = {
	id: MockId
	campusEventTeamId: MockId
	teamMembershipId: MockId
	roleName: string | null
	roleEmoji: string | null
}
export type MockVolunteerRequestStatus = "pending" | "rejected" | "resolved"
export type MockVolunteerRequest = {
	id: MockId
	campusEventTeamId: MockId
	teamMembershipId: MockId
	roleName: string
	roleEmoji: string
	status: MockVolunteerRequestStatus
	replacingId: MockId | null
}

export type MockDatabase = {
	users: Record<MockId, MockUser>
	churches: Record<MockId, MockChurch>
	campuses: Record<MockId, MockCampus>
	ministries: Record<MockId, MockMinistry>
	teams: Record<MockId, MockTeam>
	churchMemberships: Record<MockId, MockChurchMembership>
	teamMemberships: Record<MockId, MockTeamMembership>
	ministryLeaderships: Record<MockId, MockMinistryLeadership>
	campusEvents: Record<MockId, MockCampusEvent>
	campusEventMinistries: Record<MockId, MockCampusEventMinistry>
	campusEventTeams: Record<MockId, MockCampusEventTeam>
	campusEventTeamVolunteers: Record<MockId, MockCampusEventTeamVolunteer>
	volunteerRequests: Record<MockId, MockVolunteerRequest>
}
