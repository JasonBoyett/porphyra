from sqlmodel import Session, SQLModel

from app.db.engine import create_database_engine
from app.db.models import (
    Campus,
    Church,
    ChurchMembership,
    ChurchRole,
    ChurchRoleAssignment,
    ChurchRolePermission,
    Ministry,
    Team,
    User,
)
from app.permissions import action_is_permitted


def test_campus_role_permissions_do_not_cross_campuses() -> None:
    engine = create_database_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            church = Church(name="Scope Test Church")
            user = User(
                auth_id="scope-test",
                email="scope@test.example",
                name="Scope Test",
            )
            db.add_all([church, user])
            db.flush()
            austin = Campus(church_id=church.id, name="Austin")
            okc = Campus(church_id=church.id, name="OKC")
            ministry = Ministry(church_id=church.id, name="Worship")
            db.add_all([austin, okc, ministry])
            db.flush()
            team = Team(ministry_id=ministry.id, name="Band")
            membership = ChurchMembership(user_id=user.id, church_id=church.id)
            role = ChurchRole(church_id=church.id, name="Austin planner")
            db.add_all([team, membership, role])
            db.flush()
            db.add_all([
                ChurchRolePermission(
                    church_role_id=role.id,
                    permission="schedule.manage",
                ),
                ChurchRoleAssignment(
                    church_membership_id=membership.id,
                    church_role_id=role.id,
                    campus_id=austin.id,
                ),
            ])
            db.commit()

            assert action_is_permitted(
                membership,
                db,
                action="schedule.manage",
                church_id=church.id,
                campus_id=austin.id,
                team_id=team.id,
            )
            assert not action_is_permitted(
                membership,
                db,
                action="schedule.manage",
                church_id=church.id,
                campus_id=okc.id,
                team_id=team.id,
            )
    finally:
        engine.dispose()
