"""Add profile avatar URLs

Revision ID: d6d7e21b0a4f
Revises: bdaa1801a926
Create Date: 2026-11-13 03:12:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d6d7e21b0a4f"
down_revision: Union[str, Sequence[str], None] = "bdaa1801a926"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Add durable URLs for user and church profile images."""
	op.add_column(
		"church",
		sa.Column(
			"avatar_url",
			sa.String(),
			server_default=sa.text("''"),
			nullable=False,
		),
	)
	op.add_column(
		"user",
		sa.Column(
			"avatar_url",
			sa.String(),
			server_default=sa.text("''"),
			nullable=False,
		),
	)


def downgrade() -> None:
	"""Remove profile avatar URLs."""
	op.drop_column("user", "avatar_url")
	op.drop_column("church", "avatar_url")
