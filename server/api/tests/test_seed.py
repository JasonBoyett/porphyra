from zoneinfo import ZoneInfo

from sqlmodel import Session, SQLModel, select

from app.db.engine import create_database_engine
from app.db.models import (
	Campus,
	CampusEvent,
	CampusEventTeamVolunteer,
	Church,
	ChurchMembership,
	RecurringService,
	User,
	VolunteerRequest,
	VolunteerRequestStatus,
)
from app.permissions import action_is_permitted
from app.seed.load import load_seed_data, seed_database


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
			campuses_by_name = {campus.name: campus for campus in seeded_campuses}
			online = campuses_by_name["Grace Harbor Online"]
			international = campuses_by_name["Harbor Ministry Centre"]
			assert online.address_line_1 is None
			assert online.city is None
			assert online.region is None
			assert online.postal_code is None
			assert online.country_code is None
			assert international.country_code == "CA"
			assert international.time_zone == "America/Toronto"
			assert all(ZoneInfo(campus.time_zone) for campus in seeded_campuses)
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


def test_seed_data_covers_church_and_campus_onboarding_shapes() -> None:
	data = load_seed_data()
	churches = {church["name"]: church for church in data["churches"]}

	grace = churches["Grace Harbor Church"]
	riverstone = churches["Riverstone Community Church"]
	new_mercies = churches["New Mercies Fellowship"]

	assert grace["primaryCampus"] == "Downtown"
	assert len(grace["campuses"]) > 1
	assert len(riverstone["campuses"]) == 1
	assert {campus["type"] for campus in grace["campuses"]} == {
		"PHYSICAL",
		"ONLINE",
		"ADMINISTRATIVE",
		"MINISTRY_CENTER",
	}
	assert {campus["type"] for campus in new_mercies["campuses"]} == {"ONLINE"}
	assert new_mercies["primaryCampus"] == "New Mercies Online"

	online = next(
		campus for campus in grace["campuses"] if campus["type"] == "ONLINE"
	)
	international = next(
		campus
		for campus in grace["campuses"]
		if campus["name"] == "Harbor Ministry Centre"
	)
	assert set(online["location"]) == {"timeZone"}
	assert international["location"]["countryCode"] == "CA"
	assert international["location"]["timeZone"] == "America/Toronto"

	service_campuses = [
		campus
		for church in data["churches"]
		for campus in church["campuses"]
		if campus["recurringServices"]
	]
	assert service_campuses
	assert all(
		campus["type"] in {"PHYSICAL", "ONLINE"}
		for campus in service_campuses
	)
	assert all(
		set(service) == {"name", "weekday", "localStartTime"}
		for campus in service_campuses
		for service in campus["recurringServices"]
	)


def test_seed_persists_campus_types_and_primary_campuses_idempotently() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			seed_database(db)
			churches = db.exec(select(Church)).all()
			campuses = db.exec(select(Campus)).all()
			campuses_by_name = {campus.name: campus for campus in campuses}

			assert {
				campus.campus_type.name for campus in campuses
			} == {
				"PHYSICAL",
				"ONLINE",
				"ADMINISTRATIVE",
				"MINISTRY_CENTER",
			}
			for church in churches:
				assert church.primary_campus_id is not None
				assert campuses_by_name[
					next(
						item["primaryCampus"]
						for item in load_seed_data()["churches"]
						if item["name"] == church.name
					)
				].id == church.primary_campus_id

			services = db.exec(select(RecurringService)).all()
			assert len(services) == 5
			assert all(service.weekday == 6 for service in services)
			assert {
				service.campus.campus_type.name for service in services
			} <= {"PHYSICAL", "ONLINE"}
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
