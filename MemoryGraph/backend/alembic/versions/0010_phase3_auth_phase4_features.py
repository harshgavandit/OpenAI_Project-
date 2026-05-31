"""Phase 3 auth cookies + phase 4 family/archive features

Revision ID: 0010_phase3_auth_phase4
Revises: 0009_phase2_features
Create Date: 2026-05-30
"""

from alembic import op
import sqlalchemy as sa

revision = "0010_phase3_auth_phase4"
down_revision = "0009_phase2_features"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.add_column(sa.Column("refresh_token", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("refresh_expires_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index("ix_sessions_refresh_token", ["refresh_token"], unique=True)

    op.create_table(
        "family_archive_access",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("owner_user_id", sa.String(), nullable=False),
        sa.Column("member_user_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("invite_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["invite_id"], ["invite_links.id"]),
        sa.ForeignKeyConstraint(["member_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_user_id", "member_user_id"),
    )
    op.create_index("ix_family_archive_access_owner_user_id", "family_archive_access", ["owner_user_id"])
    op.create_index("ix_family_archive_access_member_user_id", "family_archive_access", ["member_user_id"])

    op.create_table(
        "archive_insight_actions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("insight_key", sa.String(length=240), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("merge_target", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "insight_key"),
    )
    op.create_index("ix_archive_insight_actions_user_id", "archive_insight_actions", ["user_id"])


def downgrade():
    op.drop_index("ix_archive_insight_actions_user_id", table_name="archive_insight_actions")
    op.drop_table("archive_insight_actions")
    op.drop_index("ix_family_archive_access_member_user_id", table_name="family_archive_access")
    op.drop_index("ix_family_archive_access_owner_user_id", table_name="family_archive_access")
    op.drop_table("family_archive_access")
    with op.batch_alter_table("sessions") as batch_op:
        batch_op.drop_index("ix_sessions_refresh_token")
        batch_op.drop_column("refresh_expires_at")
        batch_op.drop_column("refresh_token")
