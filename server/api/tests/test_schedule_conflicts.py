from typing import cast

import pytest
from fastapi import HTTPException
from sqlmodel import Session, SQLModel, select

from app.api.v1.events.campus.get import get_campus_event_planning
from app.api.v1.events.campus.teams.post import update_team_role_requirements
from app.api.v1.events.campus.teams.volunteers.post import (
	accept_volunteer_request,
	assign_volunteer,
	drop_volunteer,
	update_volunteer_role,
)
from app.api.v1.events.schemas import (
	AssignVolunteerRequest,
	UpdateTeamRoleRequirementsRequest,
	UpdateVolunteerRoleRequest,
)
from app.db.engine import create_database_engine
from app.db.models import (
	CampusEventTeam,
	CampusEventTeamVolunteer,
	ChurchMembership,
	Team,
	TeamMembership,
	User,
)
from app.seed.load import seed_database


def _assign_development_user(
	event_team: CampusEventTeam,
	role_name: str,
	db: Session,
	user: User,
) -> CampusEventTeamVolunteer:
	membership = db.exec(
		select(TeamMembership)
		.join(ChurchMembership)
		.where(
			TeamMembership.team_id == event_team.team_id,
			ChurchMembership.user_id == user.id,
		)
	).one()
	request = assign_volunteer(
		event_team.id,
		AssignVolunteerRequest(
			team_membership_id=membership.id,
			role_name=role_name,
			confirm_conflict=True,
		),
		db,
		user,
	)
	assignment = accept_volunteer_request(event_team.id, request.id, db, user)
	persisted_assignment = db.get(CampusEventTeamVolunteer, assignment.id)
	assert persisted_assignment is not None
	return persisted_assignment


def test_overlapping_assignment_requires_explicit_confirmation() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			choir = db.exec(
				select(CampusEventTeam)
				.join(Team)
				.where(Team.name == "Choir")
			).one()
			band = db.exec(
				select(CampusEventTeam)
				.join(Team)
				.where(Team.name == "Band")
			).one()
			toddlers = db.exec(
				select(CampusEventTeam)
				.join(Team)
				.where(Team.name == "Toddlers")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			_assign_development_user(band, "Worship leader", db, user)
			_assign_development_user(toddlers, "Room lead", db, user)
			choir_membership = db.exec(
				select(TeamMembership)
				.join(ChurchMembership)
				.where(
					TeamMembership.team_id == choir.team_id,
					ChurchMembership.user_id == user.id,
				)
			).one()

			with pytest.raises(HTTPException) as error:
				assign_volunteer(
					choir.id,
					AssignVolunteerRequest(team_membership_id=choir_membership.id),
					db,
					user,
				)

			assert error.value.status_code == 409
			detail = cast(dict[str, object], error.value.detail)
			assert detail["code"] == "schedule_conflict"
			conflicts = detail["conflicts"]
			assert isinstance(conflicts, list)
			assert len(conflicts) == 2
			planning = get_campus_event_planning(
				choir.event_ministry.event.id,
				db,
				user,
			)
			choir_schedule = next(
				team
				for ministry in planning.ministries
				for team in ministry.teams
				if team.name == "Choir"
			)
			assert choir_schedule.eligible_volunteers
			assert all(
				candidate.user_id != user.id
				for candidate in choir_schedule.eligible_volunteers
			)

			request = assign_volunteer(
				choir.id,
				AssignVolunteerRequest(
					team_membership_id=choir_membership.id,
					confirm_conflict=True,
				),
				db,
				user,
			)

			assert request.status == "pending"
			assignment = accept_volunteer_request(
				choir.id,
				request.id,
				db,
				user,
			)
			persisted_assignment = db.get(CampusEventTeamVolunteer, assignment.id)
			assert persisted_assignment is not None
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()


def test_event_team_roles_track_the_user_filling_each_requirement() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			band = db.exec(
				select(CampusEventTeam)
				.join(Team)
				.where(Team.name == "Band")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			assignment = _assign_development_user(band, "Worship leader", db, user)

			response = update_team_role_requirements(
				band.id,
				UpdateTeamRoleRequirementsRequest.model_validate(
					{
						"roles": {
							"Worship leader": {"emoji": "🎤", "count": 1},
							"Sound": {"emoji": "🎚️", "count": 1},
						}
					}
				),
				db,
				user,
			)
			assert response.is_fully_staffed is False
			assert response.roles.root["Worship leader"].scheduled_users == [user.id]

			update_volunteer_role(
				band.id,
				assignment.id,
				UpdateVolunteerRoleRequest(
					role_name="Sound",
					role_emoji="wrong",
				),
				db,
				user,
			)
			db.refresh(band)
			assert band.role_data.root["Worship leader"].scheduled_users == []
			assert band.role_data.root["Sound"].scheduled_users == [user.id]
			assert band.role_data.root["Sound"].emoji == "🎚️"
			assert band.is_fully_staffed is False
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()


def test_dropping_a_volunteer_removes_them_from_the_role_roster() -> None:
	engine = create_database_engine("sqlite://")
	SQLModel.metadata.create_all(engine)
	try:
		with Session(engine) as db:
			seed_database(db)
			band = db.exec(
				select(CampusEventTeam)
				.join(Team)
				.where(Team.name == "Band")
			).one()
			user = db.exec(select(User).where(User.email == "dev@a244.tech")).one()
			assignment = _assign_development_user(band, "Worship leader", db, user)

			drop_volunteer(band.id, assignment.id, db, user)

			assert db.get(CampusEventTeamVolunteer, assignment.id) is None
			db.refresh(band)
			assert band.role_data.root["Worship leader"].scheduled_users == []
	finally:
		SQLModel.metadata.drop_all(engine)
		engine.dispose()
