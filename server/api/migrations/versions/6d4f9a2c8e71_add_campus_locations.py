"""Add structured campus locations.

Revision ID: 6d4f9a2c8e71
Revises: 3e0b9c4f7a12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6d4f9a2c8e71"
down_revision: Union[str, Sequence[str], None] = "3e0b9c4f7a12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Add portable location fields with safe values for existing campuses."""
	with op.batch_alter_table("campus") as batch:
		batch.add_column(
			sa.Column("address_line_1", sa.String(), nullable=False, server_default="")
		)
		batch.add_column(sa.Column("address_line_2", sa.String(), nullable=True))
		batch.add_column(
			sa.Column("region", sa.String(), nullable=False, server_default="")
		)
		batch.add_column(
			sa.Column("postal_code", sa.String(), nullable=False, server_default="")
		)
		batch.add_column(
			sa.Column("country_code", sa.String(), nullable=False, server_default="")
		)
		batch.add_column(
			sa.Column(
				"time_zone",
				sa.String(),
				nullable=False,
				server_default="Etc/UTC",
			)
		)


def downgrade() -> None:
	"""Remove structured campus location fields."""
	with op.batch_alter_table("campus") as batch:
		batch.drop_column("time_zone")
		batch.drop_column("country_code")
		batch.drop_column("postal_code")
		batch.drop_column("region")
		batch.drop_column("address_line_2")
		batch.drop_column("address_line_1")
