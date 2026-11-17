from sqlmodel import Session, SQLModel, select

from app.api.v1.events.campus.get import get_team_volunteer_requests
from app.api.v1.events.campus.teams.post import update_team_role_requirements
from app.api.v1.events.campus.teams.volunteers.post import (
	accept_volunteer_request,
	assign_volunteer,
	create_replacement,
	decline_volunteer_request,
)
from app.api.v1.events.schemas import (
	AffectedVolunteerAction,
	AssignVolunteerRequest,
	UpdateTeamRoleRequirementsRequest,
)
from app.db.engine import create_database_engine
from app.db.models import CampusEventTeam, Team, TeamMembership, User, VolunteerRequest
from app.db.schemas import RoleTemplateData
from app.seed.load import seed_database


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


def test_changing_call_time_sends_accepted_volunteers_a_new_confirmation() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			team = db.exec(
				select(CampusEventTeam).join(Team).where(Team.name == "Band")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			assignment = team.volunteers[0]
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
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()
