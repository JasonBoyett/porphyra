"""Add pending volunteer roster requests and replacement chains.

Revision ID: 3e0b9c4f7a12
Revises: 1cb5b82e9586, 8d3c4a7e1b2f
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "3e0b9c4f7a12"
down_revision: Union[str, Sequence[str], None] = ("1cb5b82e9586", "8d3c4a7e1b2f")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	op.create_table(
		"volunteerrequest",
		sa.Column("id", sa.Uuid(), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("campus_event_team_id", sa.Uuid(), nullable=False),
		sa.Column("team_membership_id", sa.Uuid(), nullable=False),
		sa.Column("role_name", sa.String(), nullable=True),
		sa.Column("role_emoji", sa.String(), nullable=True),
		sa.Column("status", sa.String(), nullable=False),
		sa.Column("replacing_id", sa.Uuid(), nullable=True),
		sa.ForeignKeyConstraint(["campus_event_team_id"], ["campuseventteam.id"]),
		sa.ForeignKeyConstraint(["team_membership_id"], ["teammembership.id"]),
		sa.ForeignKeyConstraint(["replacing_id"], ["volunteerrequest.id"]),
		sa.PrimaryKeyConstraint("id"),
		sa.UniqueConstraint("replacing_id"),
	)
	op.create_index(
		"ix_volunteerrequest_event_team_status",
		"volunteerrequest",
		["campus_event_team_id", "status"],
	)


def downgrade() -> None:
	op.drop_index("ix_volunteerrequest_event_team_status", table_name="volunteerrequest")
	op.drop_table("volunteerrequest")
