import json
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import or_
from sqlmodel import Session, select

from app.db.models import (
	Campus,
	CampusEvent,
	CampusEventMinistry,
	CampusEventTeam,
	CampusEventTeamVolunteer,
	Church,
	ChurchMembership,
	Ministry,
	MinistryLeadership,
	Team,
	TeamMembership,
	User,
)
from app.db.schemas import RoleTemplateData
from app.scheduling.roles import RoleAssignment, build_team_role_data


def load_seed_data() -> dict[str, Any]:
	path = Path(__file__).with_name("data.json")
	return json.loads(path.read_text())


def seed_database(db: Session) -> None:
	"""Create the development data set without duplicating existing records."""
	data = load_seed_data()
	development_user = data["developmentUser"]
	user = db.exec(
		select(User).where(
			or_(
				User.auth_id == development_user["authId"],
				User.email == development_user["email"],
			)
		)
	).one_or_none()
	if user is None:
		user = User(
			auth_id=development_user["authId"],
			email=development_user["email"],
			name=development_user["name"],
		)
		db.add(user)
		db.flush()
	else:
		user.auth_id = development_user["authId"]
		user.name = development_user["name"]

	for church_data in data["churches"]:
		church = db.exec(
			select(Church).where(Church.name == church_data["name"])
		).one_or_none()
		if church is None:
			church = Church(
				name=church_data["name"],
				description=church_data["description"],
				campuses=[
					Campus(name=campus_data["name"], city=campus_data["city"])
					for campus_data in church_data["campuses"]
				],
			)
			db.add(church)
			db.flush()
		else:
			church.description = church_data["description"]

		membership = db.exec(
			select(ChurchMembership).where(
				ChurchMembership.user_id == user.id,
				ChurchMembership.church_id == church.id,
			)
		).one_or_none()
		if membership is None:
			membership = ChurchMembership(user_id=user.id, church_id=church.id)
			db.add(membership)
			db.flush()

		for campus_data in church_data["campuses"]:
			campus = db.exec(
				select(Campus).where(
					Campus.church_id == church.id,
					Campus.name == campus_data["name"],
				)
			).one_or_none()
			if campus is None:
				db.add(
					Campus(
						church_id=church.id,
						name=campus_data["name"],
						city=campus_data["city"],
					)
				)
			else:
				campus.city = campus_data["city"]

		for ministry_data in church_data["ministries"]:
			ministry = db.exec(
				select(Ministry).where(
					Ministry.church_id == church.id,
					Ministry.name == ministry_data["name"],
				)
			).one_or_none()
			if ministry is None:
				ministry = Ministry(church_id=church.id, name=ministry_data["name"])
				db.add(ministry)
				db.flush()

			leadership = db.exec(
				select(MinistryLeadership).where(
					MinistryLeadership.church_membership_id == membership.id,
					MinistryLeadership.ministry_id == ministry.id,
				)
			).one_or_none()
			if leadership is None:
				db.add(
					MinistryLeadership(
						church_membership_id=membership.id,
						ministry_id=ministry.id,
					)
				)

			for team_name in ministry_data["teams"]:
				team = db.exec(
					select(Team).where(
						Team.ministry_id == ministry.id,
						Team.name == team_name,
					)
				).one_or_none()
				if team is None:
					team = Team(ministry_id=ministry.id, name=team_name)
					db.add(team)
					db.flush()

				team_membership = db.exec(
					select(TeamMembership).where(
						TeamMembership.church_membership_id == membership.id,
						TeamMembership.team_id == team.id,
					)
				).one_or_none()
				if team_membership is None:
					db.add(
						TeamMembership(
							church_membership_id=membership.id,
							team_id=team.id,
							notes=[],
						)
					)

		church_slug = "-".join(church.name.lower().split())
		church_teams = db.exec(
			select(Team)
			.join(Ministry)
			.where(Ministry.church_id == church.id)
			.order_by(Ministry.name, Team.name)
		).all()
		for index, volunteer_name in enumerate(church_data.get("volunteers", [])):
			volunteer_slug = "-".join(volunteer_name.lower().split())
			volunteer_auth_id = f"seed:{church_slug}:{volunteer_slug}"
			volunteer_email = f"{volunteer_slug}@{church_slug}.test"
			volunteer = db.exec(
				select(User).where(User.auth_id == volunteer_auth_id)
			).one_or_none()
			if volunteer is None:
				volunteer = User(
					auth_id=volunteer_auth_id,
					email=volunteer_email,
					name=volunteer_name,
				)
				db.add(volunteer)
				db.flush()

			volunteer_membership = db.exec(
				select(ChurchMembership).where(
					ChurchMembership.user_id == volunteer.id,
					ChurchMembership.church_id == church.id,
				)
			).one_or_none()
			if volunteer_membership is None:
				volunteer_membership = ChurchMembership(
					user_id=volunteer.id,
					church_id=church.id,
				)
				db.add(volunteer_membership)
				db.flush()

			team_indexes = [index % len(church_teams)]
			if index % 5 == 0 and len(church_teams) > 1:
				team_indexes.append((index + 1) % len(church_teams))
			for team_index in team_indexes:
				team = church_teams[team_index]
				team_membership = db.exec(
					select(TeamMembership).where(
						TeamMembership.church_membership_id
						== volunteer_membership.id,
						TeamMembership.team_id == team.id,
					)
				).one_or_none()
				if team_membership is None:
					db.add(
						TeamMembership(
							church_membership_id=volunteer_membership.id,
							team_id=team.id,
							notes=[],
						)
					)

		for event_data in church_data.get("campusEvents", []):
			campus = db.exec(
				select(Campus).where(
					Campus.church_id == church.id,
					Campus.name == event_data["campus"],
				)
			).one()
			event = db.exec(
				select(CampusEvent).where(
					CampusEvent.campus_id == campus.id,
					CampusEvent.title == event_data["title"],
				)
			).one_or_none()
			if event is None:
				event = CampusEvent(
					church_id=church.id,
					campus_id=campus.id,
					title=event_data["title"],
					description=event_data["description"],
					starts_at=datetime.fromisoformat(event_data["startsAt"]),
					ends_at=datetime.fromisoformat(event_data["endsAt"]),
				)
				db.add(event)
				db.flush()

			for event_ministry_data in event_data["ministries"]:
				ministry = db.exec(
					select(Ministry).where(
						Ministry.church_id == church.id,
						Ministry.name == event_ministry_data["name"],
					)
				).one()
				event_ministry = db.exec(
					select(CampusEventMinistry).where(
						CampusEventMinistry.campus_event_id == event.id,
						CampusEventMinistry.ministry_id == ministry.id,
					)
				).one_or_none()
				if event_ministry is None:
					event_ministry = CampusEventMinistry(
						campus_event_id=event.id,
						ministry_id=ministry.id,
					)
					db.add(event_ministry)
					db.flush()

				for event_team_data in event_ministry_data["teams"]:
					role_requirements = RoleTemplateData.model_validate(
						event_team_data.get("roles", {})
					)
					team = db.exec(
						select(Team).where(
							Team.ministry_id == ministry.id,
							Team.name == event_team_data["name"],
						)
					).one()
					event_team = db.exec(
						select(CampusEventTeam).where(
							CampusEventTeam.campus_event_ministry_id
							== event_ministry.id,
							CampusEventTeam.team_id == team.id,
						)
					).one_or_none()
					call_time_data = event_team_data["callTime"]
					call_time = (
						datetime.fromisoformat(call_time_data)
						if call_time_data is not None
						else None
					)
					if event_team is None:
						event_team = CampusEventTeam(
							campus_event_ministry_id=event_ministry.id,
							team_id=team.id,
							call_time=call_time,
							notes=event_team_data["notes"],
						)
						db.add(event_team)
						db.flush()
					else:
						event_team.call_time = call_time
						event_team.notes = event_team_data["notes"]

					if event_team_data.get("assignDevelopmentUser", False):
						event_team_membership = db.exec(
							select(TeamMembership).where(
								TeamMembership.church_membership_id == membership.id,
								TeamMembership.team_id == team.id,
							)
						).one()
						assignment = db.exec(
							select(CampusEventTeamVolunteer).where(
								CampusEventTeamVolunteer.campus_event_team_id
								== event_team.id,
								CampusEventTeamVolunteer.team_membership_id
								== event_team_membership.id,
							)
						).one_or_none()
						if assignment is None:
							assignment = CampusEventTeamVolunteer(
								campus_event_team_id=event_team.id,
								team_membership_id=event_team_membership.id,
							)
							db.add(assignment)
						role_name = event_team_data.get("assignDevelopmentUserRole")
						if role_name is not None:
							assignment.role_name = role_name
							assignment.role_emoji = role_requirements.root[
								role_name
							].emoji

					db.flush()
					event_team.roles = build_team_role_data(
						role_requirements,
						[
							RoleAssignment(
								role_name=assignment.role_name,
								user_id=assignment.team_membership.church_membership.user_id,
							)
							for assignment in event_team.volunteers
						],
					).model_dump(mode="json")

	db.commit()
