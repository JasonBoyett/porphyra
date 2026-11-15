from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlmodel import Session, select

from app.db.models import CampusEventTeam, CampusEventTeamVolunteer, TeamMembership


@dataclass(frozen=True)
class ScheduleConflict:
	event_id: UUID
	event_title: str
	team_name: str
	starts_at: datetime
	ends_at: datetime


def _assignment_window(event_team: CampusEventTeam) -> tuple[datetime, datetime]:
	event = event_team.event_ministry.event
	return event_team.call_time or event.starts_at, event.ends_at or event.starts_at


def get_schedule_conflicts(
	db: Session,
	event_team: CampusEventTeam,
	team_membership: TeamMembership,
) -> list[ScheduleConflict]:
	"""Return overlapping commitments for this person, excluding the target team."""
	starts_at, ends_at = _assignment_window(event_team)
	user_id = team_membership.church_membership.user_id
	assignments = db.exec(select(CampusEventTeamVolunteer)).all()
	conflicts: list[ScheduleConflict] = []
	for assignment in assignments:
		if assignment.event_team.id == event_team.id:
			continue
		if assignment.team_membership.church_membership.user_id != user_id:
			continue
		assigned_team = assignment.event_team
		assigned_starts_at, assigned_ends_at = _assignment_window(assigned_team)
		if starts_at < assigned_ends_at and assigned_starts_at < ends_at:
			assigned_event = assigned_team.event_ministry.event
			conflicts.append(
				ScheduleConflict(
					event_id=assigned_event.id,
					event_title=assigned_event.title,
					team_name=assigned_team.team.name,
					starts_at=assigned_starts_at,
					ends_at=assigned_ends_at,
				)
			)
	return conflicts
