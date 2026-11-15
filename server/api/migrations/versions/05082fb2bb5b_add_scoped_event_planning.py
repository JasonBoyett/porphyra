"""Add scoped event planning.

Revision ID: 05082fb2bb5b
Revises: e24a8c67d9b2
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "05082fb2bb5b"
down_revision: Union[str, Sequence[str], None] = "e24a8c67d9b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Create campus and church-wide event planning tables."""
	op.create_table(
		"churchevent",
		sa.Column("id", sa.Uuid(), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("church_id", sa.Uuid(), nullable=False),
		sa.Column("title", sa.String(), nullable=False),
		sa.Column("description", sa.String(), nullable=False),
		sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
		sa.ForeignKeyConstraint(["church_id"], ["church.id"]),
		sa.PrimaryKeyConstraint("id"),
	)
	op.create_table(
		"campusevent",
		sa.Column("id", sa.Uuid(), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("church_id", sa.Uuid(), nullable=False),
		sa.Column("title", sa.String(), nullable=False),
		sa.Column("description", sa.String(), nullable=False),
		sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
		sa.Column("campus_id", sa.Uuid(), nullable=False),
		sa.ForeignKeyConstraint(["campus_id"], ["campus.id"]),
		sa.ForeignKeyConstraint(["church_id"], ["church.id"]),
		sa.PrimaryKeyConstraint("id"),
	)
	for table_name, event_column, event_table in (
		("churcheventministry", "church_event_id", "churchevent"),
		("campuseventministry", "campus_event_id", "campusevent"),
	):
		op.create_table(
			table_name,
			sa.Column("id", sa.Uuid(), nullable=False),
			sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
			sa.Column(event_column, sa.Uuid(), nullable=False),
			sa.Column("ministry_id", sa.Uuid(), nullable=False),
			sa.ForeignKeyConstraint([event_column], [f"{event_table}.id"]),
			sa.ForeignKeyConstraint(["ministry_id"], ["ministry.id"]),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint(event_column, "ministry_id"),
		)
	for table_name, parent_column, parent_table in (
		("campuseventteam", "campus_event_ministry_id", "campuseventministry"),
		("churcheventteam", "church_event_ministry_id", "churcheventministry"),
	):
		op.create_table(
			table_name,
			sa.Column("id", sa.Uuid(), nullable=False),
			sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
			sa.Column("team_id", sa.Uuid(), nullable=False),
			sa.Column("call_time", sa.DateTime(timezone=True), nullable=True),
			sa.Column("notes", sa.JSON(), nullable=False),
			sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
			sa.Column("confirmed_by_team_membership_id", sa.Uuid(), nullable=True),
			sa.Column(parent_column, sa.Uuid(), nullable=False),
			sa.ForeignKeyConstraint([parent_column], [f"{parent_table}.id"]),
			sa.ForeignKeyConstraint(
				["confirmed_by_team_membership_id"], ["teammembership.id"]
			),
			sa.ForeignKeyConstraint(["team_id"], ["team.id"]),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint(parent_column, "team_id"),
		)
	for table_name, event_team_column, event_team_table in (
		("campuseventteamvolunteer", "campus_event_team_id", "campuseventteam"),
		("churcheventteamvolunteer", "church_event_team_id", "churcheventteam"),
	):
		op.create_table(
			table_name,
			sa.Column("id", sa.Uuid(), nullable=False),
			sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
			sa.Column(event_team_column, sa.Uuid(), nullable=False),
			sa.Column("team_membership_id", sa.Uuid(), nullable=False),
			sa.ForeignKeyConstraint([event_team_column], [f"{event_team_table}.id"]),
			sa.ForeignKeyConstraint(["team_membership_id"], ["teammembership.id"]),
			sa.PrimaryKeyConstraint("id"),
			sa.UniqueConstraint(event_team_column, "team_membership_id"),
		)


def downgrade() -> None:
	"""Remove campus and church-wide event planning tables."""
	for table_name in (
		"churcheventteamvolunteer",
		"campuseventteamvolunteer",
		"churcheventteam",
		"campuseventteam",
		"campuseventministry",
		"churcheventministry",
		"campusevent",
		"churchevent",
	):
		op.drop_table(table_name)
