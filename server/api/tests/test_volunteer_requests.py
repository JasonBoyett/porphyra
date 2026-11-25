import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, select

from app.api.v1.events.campus.get import (
	get_my_volunteer_assignments,
	get_team_volunteer_requests,
)
from app.api.v1.events.campus.teams.post import update_team_role_requirements
from app.api.v1.events.campus.teams.volunteers.post import (
	accept_volunteer_request,
	assign_volunteer,
	cancel_my_volunteer_assignment,
	create_replacement,
	decline_volunteer_request,
)
from app.api.v1.events.schemas import (
	AffectedVolunteerAction,
	AssignVolunteerRequest,
	UpdateTeamRoleRequirementsRequest,
)
from app.db.engine import create_database_engine
from app.db.models import (
	CampusEventTeam,
	CampusEventTeamVolunteer,
	Team,
	TeamMembership,
	User,
	VolunteerRequest,
)
from app.db.schemas import RoleTemplateData
from app.seed.load import seed_database
from app.sync.contracts import SyncTarget
from app.sync.registry import socket_registry


def test_accepting_a_replacement_resolves_rejected_request_history() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			team = db.exec(
				select(CampusEventTeam).join(Team).where(Team.name == "Choir")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			memberships = db.exec(
				select(TeamMembership).where(TeamMembership.team_id == team.team_id)
			).all()

			rejected = assign_volunteer(
				team.id,
				AssignVolunteerRequest(
					team_membership_id=memberships[0].id,
					confirm_conflict=True,
				),
				db,
				user,
			)
			decline_volunteer_request(team.id, rejected.id, db, user)
			successor = create_replacement(
				team.id,
				rejected.id,
				AssignVolunteerRequest(
					team_membership_id=memberships[1].id,
					confirm_conflict=True,
				),
				db,
				user,
			)
			assignment = accept_volunteer_request(team.id, successor.id, db, user)

			assert assignment.team_membership_id == memberships[1].id
			assert db.get(VolunteerRequest, rejected.id).status == "rejected_resolved"  # type: ignore[union-attr]
			visible_request_ids = {
				request.id
				for request in get_team_volunteer_requests(team.id, db, user)
			}
			assert successor.id in visible_request_ids
			assert rejected.id not in visible_request_ids
			history_request_ids = {
				request.id
				for request in get_team_volunteer_requests(
					team.id, db, user, include_resolved=True
				)
			}
			assert {rejected.id, successor.id}.issubset(history_request_ids)
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()


def test_changing_call_time_refreshes_accepted_volunteer_schedules(monkeypatch) -> None:
	notifications = []
	monkeypatch.setattr(socket_registry, "notify", notifications.append)
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			team = db.exec(
				select(CampusEventTeam).join(Team).where(Team.name == "Band")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			request = assign_volunteer(
				team.id,
				AssignVolunteerRequest(
					team_membership_id=team.team.memberships[0].id,
					confirm_conflict=True,
				),
				db,
				user,
			)
			accepted = accept_volunteer_request(team.id, request.id, db, user)
			assignment = db.get(CampusEventTeamVolunteer, accepted.id)
			assert assignment is not None
			assignment_user_id = assignment.team_membership.church_membership.user_id
			team_membership_id = assignment.team_membership_id
			roles = RoleTemplateData.model_validate({
				"Worship leader": {"emoji": "🎤", "count": 1},
				"Keys": {"emoji": "🎹", "count": 1},
				"Sound": {"emoji": "🎚️", "count": 1},
			})

			update_team_role_requirements(
				team.id,
				UpdateTeamRoleRequirementsRequest(
					roles=roles,
					call_time=team.call_time.replace(hour=5),  # type: ignore[union-attr]
					affected_volunteers=[
						AffectedVolunteerAction(
							action="reassign",
							assignment_id=assignment.id,
							role_name="Worship leader",
						)
					],
				),
				db,
				user,
			)

			assert team.volunteers == []
			request = db.exec(
				select(VolunteerRequest).where(
					VolunteerRequest.team_membership_id == team_membership_id,
					VolunteerRequest.status == "pending",
				)
			).one()
			assert request.role_name == "Worship leader"
			assert any(
				notification.recipients == (assignment_user_id,)
				and SyncTarget(
					"my-volunteer-assignments",
					{"userId": str(assignment_user_id)},
				)
				in notification.targets
				for notification in notifications
			)
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()


def test_my_volunteer_assignments_returns_accepted_schedule_details() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			team = db.exec(
				select(CampusEventTeam).join(Team).where(Team.name == "Choir")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			membership = next(
				membership
				for membership in team.team.memberships
				if membership.church_membership.user_id == user.id
			)
			request = assign_volunteer(
				team.id,
				AssignVolunteerRequest(
					team_membership_id=membership.id,
					confirm_conflict=True,
				),
				db,
				user,
			)
			accept_volunteer_request(team.id, request.id, db, user)

			schedule = get_my_volunteer_assignments(db, user)

			assert schedule.user_id == user.id
			assert len(schedule.assignments) == 1
			assignment = schedule.assignments[0]
			assert assignment.id is not None
			assert assignment.campus_event_team_id == team.id
			assert assignment.team_id == team.id
			assert assignment.team_name == "Choir"
			assert assignment.event_title == "Sunday Worship Service"
			assert assignment.campus_name
			assert assignment.event_starts_at is not None
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()


def test_volunteer_can_cancel_only_their_own_assignment() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			team = db.exec(
				select(CampusEventTeam).join(Team).where(Team.name == "Choir")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			membership = next(
				membership
				for membership in team.team.memberships
				if membership.church_membership.user_id == user.id
			)
			request = assign_volunteer(
				team.id,
				AssignVolunteerRequest(
					team_membership_id=membership.id,
					confirm_conflict=True,
				),
				db,
				user,
			)
			accepted = accept_volunteer_request(team.id, request.id, db, user)
			other_user = db.exec(select(User).where(User.id != user.id)).first()
			assert other_user is not None

			with pytest.raises(HTTPException, match="404"):
				cancel_my_volunteer_assignment(team.id, accepted.id, db, other_user)

			cancel_my_volunteer_assignment(team.id, accepted.id, db, user)

			assert db.get(CampusEventTeamVolunteer, accepted.id) is None
			assert db.get(VolunteerRequest, request.id).status == "cancelled"  # type: ignore[union-attr]
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()
