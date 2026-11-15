"""Add role-requirement snapshots to event teams.

Revision ID: 8d3c4a7e1b2f
Revises: 1cb5b82e9586
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8d3c4a7e1b2f"
down_revision: Union[str, Sequence[str], None] = "1cb5b82e9586"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Persist reusable templates and each event team's editable role snapshot."""
	bind = op.get_bind()
	inspector = sa.inspect(bind)
	for table_name in ("campuseventteam", "churcheventteam"):
		column_names = {
			column["name"] for column in inspector.get_columns(table_name)
		}
		if "roles" in column_names:
			continue
		with op.batch_alter_table(table_name) as batch:
			batch.add_column(
				sa.Column(
					"roles",
					sa.JSON(),
					nullable=False,
					server_default=sa.text("'{}'"),
				)
			)

	if "publicroletemplate" not in inspector.get_table_names():
		op.create_table(
			"publicroletemplate",
			sa.Column("id", sa.Uuid(), nullable=False),
			sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
			sa.Column("name", sa.String(), nullable=False),
			sa.Column("roles", sa.JSON(), nullable=False),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint("name"),
		)
	if "churchroletemplate" not in inspector.get_table_names():
		op.create_table(
			"churchroletemplate",
			sa.Column("id", sa.Uuid(), nullable=False),
			sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
			sa.Column("name", sa.String(), nullable=False),
			sa.Column("roles", sa.JSON(), nullable=False),
			sa.Column("church_id", sa.Uuid(), nullable=False),
			sa.ForeignKeyConstraint(["church_id"], ["church.id"]),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint("church_id", "name"),
		)
	if "campusroletemplate" not in inspector.get_table_names():
		op.create_table(
			"campusroletemplate",
			sa.Column("id", sa.Uuid(), nullable=False),
			sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
			sa.Column("name", sa.String(), nullable=False),
			sa.Column("roles", sa.JSON(), nullable=False),
			sa.Column("campus_id", sa.Uuid(), nullable=False),
			sa.ForeignKeyConstraint(["campus_id"], ["campus.id"]),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint("campus_id", "name"),
		)


def downgrade() -> None:
	"""Remove templates and event-specific role snapshots."""
	for table_name in (
		"campusroletemplate",
		"churchroletemplate",
		"publicroletemplate",
	):
		op.drop_table(table_name)

	for table_name in ("churcheventteam", "campuseventteam"):
		with op.batch_alter_table(table_name) as batch:
			batch.drop_column("roles")
