# Updated by GitHub contribution automation.
"""Phase 2: one life story shares, ritual responses, capsule notify

Revision ID: 0009_phase2
Revises: 0008_add_end_to_end_family_features
Create Date: 2026-05-30

"""
from alembic import op
import sqlalchemy as sa

revision = "0009_phase2"
down_revision = "0008_add_end_to_end_family_features"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "one_life_story_shares",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("share_token", sa.String(length=96), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_one_life_story_shares_user_id", "one_life_story_shares", ["user_id"])
    op.create_index("ix_one_life_story_shares_share_token", "one_life_story_shares", ["share_token"], unique=True)

    with op.batch_alter_table("family_rituals") as batch:
        batch.add_column(sa.Column("responses_json", sa.JSON(), server_default="[]", nullable=False))

    with op.batch_alter_table("memory_capsules") as batch:
        batch.add_column(sa.Column("unlock_notified", sa.Boolean(), server_default="0", nullable=False))


def downgrade():
    with op.batch_alter_table("memory_capsules") as batch:
        batch.drop_column("unlock_notified")
    with op.batch_alter_table("family_rituals") as batch:
        batch.drop_column("responses_json")
    op.drop_table("one_life_story_shares")
