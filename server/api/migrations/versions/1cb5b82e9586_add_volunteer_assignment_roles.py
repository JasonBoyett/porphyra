"""Add optional roles to event volunteer assignments.

Revision ID: 1cb5b82e9586
Revises: 2a97ccf0df8b
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1cb5b82e9586"
down_revision: Union[str, Sequence[str], None] = "2a97ccf0df8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Store a role label and an optional visual marker for each assignment."""
	with op.batch_alter_table("campuseventteamvolunteer") as batch:
		batch.add_column(sa.Column("role_name", sa.String(), nullable=True))
		batch.add_column(sa.Column("role_emoji", sa.String(), nullable=True))


def downgrade() -> None:
	"""Remove assignment role metadata."""
	with op.batch_alter_table("campuseventteamvolunteer") as batch:
		batch.drop_column("role_emoji")
		batch.drop_column("role_name")
