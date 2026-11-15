import type { VolunteerAssignment } from "../types"

export type UpcomingAssignmentsProps = {
	assignments: readonly VolunteerAssignment[]
}

export type AssignmentCardProps = {
	assignment: VolunteerAssignment
}
