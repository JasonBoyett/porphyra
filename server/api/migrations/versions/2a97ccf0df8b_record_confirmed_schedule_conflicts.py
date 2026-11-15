"""Record confirmed schedule conflicts.

Revision ID: 2a97ccf0df8b
Revises: 05082fb2bb5b
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2a97ccf0df8b"
down_revision: Union[str, Sequence[str], None] = "05082fb2bb5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_confirmer_foreign_key = "fk_event_volunteer_conflict_confirmer"


def upgrade() -> None:
	"""Persist the explicit override for an overlapping assignment."""
	with op.batch_alter_table("campuseventteamvolunteer") as batch:
		batch.add_column(
			sa.Column(
				"conflict_confirmed_at",
				sa.DateTime(timezone=True),
				nullable=True,
			)
		)
		batch.add_column(
			sa.Column("conflict_confirmed_by_user_id", sa.Uuid(), nullable=True)
		)
		batch.create_foreign_key(
			_confirmer_foreign_key,
			"user",
			["conflict_confirmed_by_user_id"],
			["id"],
		)


def downgrade() -> None:
	"""Remove explicit conflict override metadata."""
	with op.batch_alter_table("campuseventteamvolunteer") as batch:
		batch.drop_constraint(_confirmer_foreign_key, type_="foreignkey")
		batch.drop_column("conflict_confirmed_by_user_id")
		batch.drop_column("conflict_confirmed_at")
