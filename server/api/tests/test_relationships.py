from datetime import UTC, datetime

from sqlmodel import Session, SQLModel

from app.db.engine import create_database_engine
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


def test_campus_event_requires_every_planned_team_to_confirm() -> None:
    engine = create_database_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            church = Church(name="Grace Harbor")
            user = User(name="Susie", email="susie@example.com", auth_id="auth-susie")
            db.add_all([church, user])
            db.flush()

            campus = Campus(church_id=church.id, name="Downtown")
            ministry = Ministry(church_id=church.id, name="Music")
            membership = ChurchMembership(user_id=user.id, church_id=church.id)
            db.add_all([campus, ministry, membership])
            db.flush()

            band = Team(ministry_id=ministry.id, name="Band")
            choir = Team(ministry_id=ministry.id, name="Choir")
            db.add_all([band, choir])
            db.flush()

            band_membership = TeamMembership(
                church_membership_id=membership.id,
                team_id=band.id,
            )
            choir_membership = TeamMembership(
                church_membership_id=membership.id,
                team_id=choir.id,
            )
            db.add_all([band_membership, choir_membership])
            db.flush()

            starts_at = datetime(2026, 11, 15, 15, tzinfo=UTC)
            event = CampusEvent(
                church_id=church.id,
                campus_id=campus.id,
                title="Sunday Gathering",
                starts_at=starts_at,
            )
            db.add(event)
            db.flush()

            event_ministry = CampusEventMinistry(
                campus_event_id=event.id,
                ministry_id=ministry.id,
            )
            db.add(event_ministry)
            db.flush()

            confirmed_team = CampusEventTeam(
                campus_event_ministry_id=event_ministry.id,
                team_id=band.id,
                call_time=starts_at,
                confirmed_at=starts_at,
                confirmed_by_team_membership_id=band_membership.id,
            )
            unconfirmed_team = CampusEventTeam(
                campus_event_ministry_id=event_ministry.id,
                team_id=choir.id,
            )
            db.add_all([confirmed_team, unconfirmed_team])
            db.flush()

            db.add(
                CampusEventTeamVolunteer(
                    campus_event_team_id=confirmed_team.id,
                    team_membership_id=band_membership.id,
                )
            )
            db.commit()
            db.refresh(event)

            assert event.is_staffed is False
            assert event.teams_needing_confirmation == [unconfirmed_team]

            unconfirmed_team.confirmed_at = starts_at
            unconfirmed_team.confirmed_by_team_membership_id = choir_membership.id
            db.commit()
            db.refresh(event)

            assert event.teams_needing_confirmation == []
            assert event.is_staffed is True
    finally:
        SQLModel.metadata.drop_all(engine)
        engine.dispose()
