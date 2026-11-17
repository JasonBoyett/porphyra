from sqlmodel import Session, SQLModel, select

from app.db.engine import create_database_engine
from app.db.models import (
	CampusEvent,
	CampusEventTeamVolunteer,
	Church,
	ChurchMembership,
	User,
	VolunteerRequest,
	VolunteerRequestStatus,
)
from app.seed.load import seed_database


def test_seeded_sunday_service_assigns_development_user_idempotently() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			seed_database(db)
			event = db.exec(
				select(CampusEvent).where(
					CampusEvent.title == "Sunday Worship Service"
				)
			).one()
			planned_teams = {
				team.team.name: team
				for ministry in event.ministries
				for team in ministry.teams
			}
			assignments = db.exec(select(CampusEventTeamVolunteer)).all()
			development_user = db.exec(
				select(User).where(User.email == "dev@a244.tech")
			).one()

			assert len(planned_teams) == 4
			assert event.is_staffed is False
			assert {
				team.id for team in event.teams_needing_confirmation
			} == {team.id for team in planned_teams.values()}
			assert len(assignments) == 2
			assert {
				assignment.team_membership.church_membership.user_id
				for assignment in assignments
			} == {development_user.id}
			assert {assignment.event_team.team.name for assignment in assignments} == {
				"Band",
				"Fourth Grade",
			}
			assert planned_teams["Band"].call_time is not None
			assert planned_teams["Fourth Grade"].call_time is None
			assert (
				planned_teams["Fourth Grade"].call_time or event.starts_at
			) == event.starts_at
			assert not planned_teams["Choir"].volunteers
			assert not planned_teams["Toddlers"].volunteers
			for team in planned_teams.values():
				requests = db.exec(
					select(VolunteerRequest).where(
						VolunteerRequest.campus_event_team_id == team.id
					)
				).all()
				replaced_request_ids = {
					request.replacing_id
					for request in requests
					if request.replacing_id is not None
				}
				for role_name, role in team.role_data.root.items():
					pending_count = sum(
						request.status == VolunteerRequestStatus.PENDING
						and request.role_name == role_name
						and request.id not in replaced_request_ids
						for request in requests
					)
					assert len(role.scheduled_users) + pending_count <= role.count
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()


def test_each_seeded_church_has_a_full_volunteer_roster() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			churches = db.exec(select(Church)).all()

			assert len(churches) == 3
			for church in churches:
				memberships = db.exec(
					select(ChurchMembership).where(
						ChurchMembership.church_id == church.id
					)
				).all()
				assert len(memberships) == 25
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()
