from sqlmodel import Session, SQLModel

from app.db.engine import create_database_engine
from app.db.models import (
    Church,
    ChurchMembership,
    Ministry,
    MinistryLeadership,
    Team,
    TeamMembership,
    User,
)


def test_team_data_is_scoped_to_a_church_membership() -> None:
    engine = create_database_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            user = User(name="Susie", email="susie@example.com", auth_id="auth-susie")
            church = Church(name="Grace Harbor")
            db.add_all([user, church])
            db.flush()

            membership = ChurchMembership(user_id=user.id, church_id=church.id)
            ministry = Ministry(church_id=church.id, name="Music")
            db.add_all([membership, ministry])
            db.flush()

            team = Team(ministry_id=ministry.id, name="Band")
            db.add(team)
            db.flush()

            team_membership = TeamMembership(
                church_membership_id=membership.id,
                team_id=team.id,
                notes=["Can play electric guitar."],
            )
            ministry_leadership = MinistryLeadership(
                church_membership_id=membership.id,
                ministry_id=ministry.id,
            )
            db.add_all([team_membership, ministry_leadership])
            db.commit()

            assert team_membership.notes == ["Can play electric guitar."]
            assert membership.user is user
            assert team.ministry is ministry
            assert ministry.church is church
    finally:
        SQLModel.metadata.drop_all(engine)
        engine.dispose()
