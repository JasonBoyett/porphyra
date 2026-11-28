from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Column, ForeignKey, UniqueConstraint, Uuid

from app.avatars import dicebear_avatar_url
from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
    # This is type-only; SQLAlchemy resolves the relationship by model name.
    from app.db.models.campus import Campus
    from app.db.models.campus_event import CampusEvent
    from app.db.models.church_event import ChurchEvent
    from app.db.models.church_membership import ChurchMembership
    from app.db.models.ministry import Ministry
    from app.db.models.role_template import ChurchRoleTemplate


class Church(DatabaseModel, table=True):
    __table_args__ = (UniqueConstraint("name"),)

    name: str
    description: str = typed_field(default="")
    profile_image_url: str | None = typed_field(default=None, nullable=True)
    onboarding_key: UUID | None = typed_field(
        default=None, nullable=True, index=True, unique=True
    )
    primary_campus_id: UUID | None = typed_field(
        default=None,
        sa_column=Column(
            Uuid(as_uuid=True),
            ForeignKey(
                "campus.id",
                ondelete="SET NULL",
                use_alter=True,
                name="fk_church_primary_campus_id_campus",
            ),
            nullable=True,
        ),
    )
    campuses: list["Campus"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "foreign_keys": "Campus.church_id",
        },
    )
    campus_events: list["CampusEvent"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    church_events: list["ChurchEvent"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    memberships: list["ChurchMembership"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    ministries: list["Ministry"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    role_templates: list["ChurchRoleTemplate"] = typed_relationship(
        back_populates="church",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    @property
    def avatar_url(self) -> str:
        """Return the stored profile image or this church's stable Stack fallback."""
        return self.profile_image_url or dicebear_avatar_url("stack", self.name)
