from typing import TYPE_CHECKING, Self
from uuid import UUID

from sqlalchemy import UniqueConstraint
from sqlmodel import Session, select

from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    from app.db.models.church import Church
    from app.db.models.ministry_leadership import MinistryLeadership
    from app.db.models.team_membership import TeamMembership
    from app.db.models.user import User


class ChurchMembership(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "church_id"),)  # pyright: ignore[reportUnannotatedClassAttribute]

    user_id: UUID = typed_field(foreign_key="user.id")
    church_id: UUID = typed_field(foreign_key="church.id")
    user: "User" = typed_relationship(back_populates="memberships")
    church: "Church" = typed_relationship(back_populates="memberships")
    team_memberships: list["TeamMembership"] = typed_relationship(
        back_populates="church_membership",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    ministry_leaderships: list["MinistryLeadership"] = typed_relationship(
        back_populates="church_membership",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    @classmethod
    def get_all_for_user(
        cls,
        db: Session,
        user_id: UUID,
    ) -> list[Self]:

        memberships = db.exec(select(cls).where(cls.user_id == user_id)).all()
        return [membership for membership in memberships]

    @classmethod
    def get_for_user_in_church(
        cls, db: Session, user_id: UUID, church_id: str
    ) -> Self | None:
        return db.exec(
            select(cls).where(cls.user_id == user_id).where(cls.church_id == church_id)
        ).first()

    def action_is_permitted(self, db: Session, **kwargs: object) -> bool:
        from app.permissions import action_is_permitted

        return action_is_permitted(self, db, **kwargs)  # type: ignore[arg-type]
