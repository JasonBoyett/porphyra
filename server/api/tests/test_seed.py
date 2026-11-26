from sqlmodel import Session, SQLModel, select

from app.db.engine import create_database_engine
from app.db.models import (
	Campus,
	CampusEvent,
	CampusEventTeamVolunteer,
	Church,
	ChurchMembership,
	User,
	VolunteerRequest,
	VolunteerRequestStatus,
)
from app.permissions import action_is_permitted
from app.seed.load import seed_database


def test_seeded_sunday_service_leaves_development_user_available_idempotently() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			seed_database(db)
			seeded_campuses = db.exec(select(Campus)).all()
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

			assert len(planned_teams) == 4
			assert event.is_staffed is False
			assert {
				team.id for team in event.teams_needing_confirmation
			} == {team.id for team in planned_teams.values()}
			assert assignments == []
			assert all(campus.address_line_1 for campus in seeded_campuses)
			assert all(campus.region for campus in seeded_campuses)
			assert all(campus.postal_code for campus in seeded_campuses)
			assert all(campus.country_code == "US" for campus in seeded_campuses)
			assert all(
				campus.time_zone == "America/Chicago" for campus in seeded_campuses
			)
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


def test_seeded_roles_exercise_church_campus_and_team_scopes() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			church = db.exec(
				select(Church).where(Church.name == "Grace Harbor Church")
			).one()
			downtown = next(
				campus for campus in church.campuses if campus.name == "Downtown"
			)
			eastside = next(
				campus for campus in church.campuses if campus.name == "Eastside"
			)
			amelia = db.exec(select(User).where(User.name == "Amelia Brooks")).one()
			membership = db.exec(
				select(ChurchMembership).where(
					ChurchMembership.user_id == amelia.id,
					ChurchMembership.church_id == church.id,
				)
			).one()

			assert action_is_permitted(
				membership,
				db,
				action="schedule.manage",
				church_id=church.id,
				campus_id=downtown.id,
			)
			assert not action_is_permitted(
				membership,
				db,
				action="schedule.manage",
				church_id=church.id,
				campus_id=eastside.id,
			)
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()
