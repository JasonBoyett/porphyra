"""Add scoped church roles.

Revision ID: 19ad1ac3c6fe
Revises: 05082fb2bb5b
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "19ad1ac3c6fe"
down_revision: Union[str, Sequence[str], None] = "05082fb2bb5b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "churchrole",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("church_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("is_administrator", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["church_id"], ["church.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("church_id", "name"),
    )
    op.create_table(
        "churchrolepermission",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("church_role_id", sa.Uuid(), nullable=False),
        sa.Column("permission", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["church_role_id"], ["churchrole.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("church_role_id", "permission"),
    )
    op.create_table(
        "churchroleassignment",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("church_membership_id", sa.Uuid(), nullable=False),
        sa.Column("church_role_id", sa.Uuid(), nullable=False),
        sa.Column("campus_id", sa.Uuid(), nullable=True),
        sa.Column("team_id", sa.Uuid(), nullable=True),
        sa.CheckConstraint(
            "team_id IS NULL OR campus_id IS NOT NULL",
            name="team_assignment_requires_campus",
        ),
        sa.ForeignKeyConstraint(["church_membership_id"], ["churchmembership.id"]),
        sa.ForeignKeyConstraint(["church_role_id"], ["churchrole.id"]),
        sa.ForeignKeyConstraint(["campus_id"], ["campus.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["team.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "church_membership_id", "church_role_id", "campus_id", "team_id"
        ),
    )


def downgrade() -> None:
    op.drop_table("churchroleassignment")
    op.drop_table("churchrolepermission")
    op.drop_table("churchrole")
