"""Add campus identity, church onboarding, recurring services and invitations.

Revision ID: a84f7c2d91e3
Revises: 6d4f9a2c8e71, 19ad1ac3c6fe
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a84f7c2d91e3"
down_revision: Union[str, Sequence[str], None] = (
    "6d4f9a2c8e71",
    "19ad1ac3c6fe",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("campus") as batch:
        batch.add_column(
            sa.Column(
                "campus_type",
                sa.Enum(
                    "PHYSICAL",
                    "ONLINE",
                    "ADMINISTRATIVE",
                    "MINISTRY_CENTER",
                    name="campustype",
                ),
                nullable=False,
                server_default="PHYSICAL",
            )
        )
        for column_name in (
            "address_line_1",
            "city",
            "region",
            "postal_code",
            "country_code",
        ):
            batch.alter_column(column_name, existing_type=sa.String(), nullable=True)
        batch.alter_column(
            "time_zone",
            existing_type=sa.String(),
            server_default="America/Chicago",
        )

    with op.batch_alter_table("church") as batch:
        batch.add_column(sa.Column("onboarding_key", sa.Uuid(), nullable=True))
        batch.add_column(sa.Column("primary_campus_id", sa.Uuid(), nullable=True))
        batch.create_index("ix_church_onboarding_key", ["onboarding_key"], unique=True)
        batch.create_foreign_key(
            "fk_church_primary_campus_id_campus",
            "campus",
            ["primary_campus_id"],
            ["id"],
            ondelete="SET NULL",
        )

    op.create_table(
        "recurringservice",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("campus_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("starts_at", sa.Time(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["campus_id"], ["campus.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campus_id", "name", "weekday", "starts_at"),
    )
    op.create_table(
        "invitation",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("church_id", sa.Uuid(), nullable=False),
        sa.Column("campus_id", sa.Uuid(), nullable=True),
        sa.Column("creator_user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimed_by_user_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(["church_id"], ["church.id"]),
        sa.ForeignKeyConstraint(["campus_id"], ["campus.id"]),
        sa.ForeignKeyConstraint(["creator_user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["claimed_by_user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_invitation_token_hash", "invitation", ["token_hash"], unique=True
    )
    op.create_table(
        "invitationteam",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invitation_id", sa.Uuid(), nullable=False),
        sa.Column("team_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["invitation_id"], ["invitation.id"]),
        sa.ForeignKeyConstraint(["team_id"], ["team.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invitation_id", "team_id"),
    )
    op.create_table(
        "invitationrole",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invitation_id", sa.Uuid(), nullable=False),
        sa.Column("church_role_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["invitation_id"], ["invitation.id"]),
        sa.ForeignKeyConstraint(["church_role_id"], ["churchrole.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invitation_id", "church_role_id"),
    )


def downgrade() -> None:
    op.drop_table("invitationrole")
    op.drop_table("invitationteam")
    op.drop_index("ix_invitation_token_hash", table_name="invitation")
    op.drop_table("invitation")
    op.drop_table("recurringservice")
    with op.batch_alter_table("church") as batch:
        batch.drop_constraint("fk_church_primary_campus_id_campus", type_="foreignkey")
        batch.drop_index("ix_church_onboarding_key")
        batch.drop_column("primary_campus_id")
        batch.drop_column("onboarding_key")
    with op.batch_alter_table("campus") as batch:
        for column_name in (
            "address_line_1",
            "city",
            "region",
            "postal_code",
            "country_code",
        ):
            batch.alter_column(
                column_name,
                existing_type=sa.String(),
                nullable=False,
                server_default="",
            )
        batch.drop_column("campus_type")
