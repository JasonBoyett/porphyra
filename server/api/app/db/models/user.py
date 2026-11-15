from typing import TYPE_CHECKING

from app.avatars import dicebear_avatar_url
from app.db.field import typed_field
from app.db.models.base_model import DatabaseModel
from app.db.relationships import typed_relationship

if TYPE_CHECKING:
	from app.db.models.church_membership import ChurchMembership


class User(DatabaseModel, table=True):
	name: str
	email: str = typed_field(index=True, unique=True)
	auth_id: str = typed_field(index=True, unique=True)
	profile_image_url: str | None = typed_field(default=None, nullable=True)
	memberships: list["ChurchMembership"] = typed_relationship(
		back_populates="user",
		sa_relationship_kwargs={"cascade": "all, delete-orphan"},
	)

	@property
	def avatar_url(self) -> str:
		"""Return the stored profile image or this user's stable Clay fallback."""
		return self.profile_image_url or dicebear_avatar_url("clay", self.auth_id)
