import json
from pathlib import Path
from typing import Any

from sqlalchemy import or_
from sqlmodel import Session, select

from app.db.models import (
    Campus,
    Church,
    ChurchMembership,
    Ministry,
    MinistryLeadership,
    Team,
    TeamMembership,
    User,
)


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

    db.commit()
