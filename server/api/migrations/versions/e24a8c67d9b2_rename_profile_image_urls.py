"""Rename profile image URLs

Revision ID: e24a8c67d9b2
Revises: d6d7e21b0a4f
Create Date: 2026-11-13 03:18:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e24a8c67d9b2"
down_revision: Union[str, Sequence[str], None] = "d6d7e21b0a4f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Rename the stored override and retain DiceBear as a model fallback."""
	for table_name in ("church", "user"):
		with op.batch_alter_table(table_name) as batch:
			batch.alter_column(
				"avatar_url",
				new_column_name="profile_image_url",
				existing_type=sa.String(),
				existing_nullable=False,
				nullable=True,
			)
		op.execute(
			f"UPDATE {table_name} SET profile_image_url = NULL "
			"WHERE profile_image_url LIKE 'https://api.dicebear.com/%'"
		)


def downgrade() -> None:
	"""Restore the previous non-nullable column name."""
	for table_name in ("church", "user"):
		op.execute(
			f"UPDATE {table_name} SET profile_image_url = '' "
			"WHERE profile_image_url IS NULL"
		)
		with op.batch_alter_table(table_name) as batch:
			batch.alter_column(
				"profile_image_url",
				new_column_name="avatar_url",
				existing_type=sa.String(),
				existing_nullable=True,
				nullable=False,
			)
