"""initial saas schema

Revision ID: 0001
Revises:
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=200)),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("plan", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("storage_limit_mb", sa.Integer(), nullable=False),
        sa.Column("current_storage_bytes", sa.Integer(), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=255)),
        sa.Column("stripe_subscription_id", sa.String(length=255)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "memories",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("structured_data", sa.JSON(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("processing_stage", sa.String(length=80), nullable=False),
        sa.Column("processing_error", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_memories_user_id", "memories", ["user_id"])
    op.create_index("ix_memories_status", "memories", ["status"])

    op.create_table(
        "media",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("memory_id", sa.String(), sa.ForeignKey("memories.id"), nullable=False),
        sa.Column("original_filename", sa.String(length=500), nullable=False),
        sa.Column("storage_provider", sa.String(length=50), nullable=False),
        sa.Column("storage_path", sa.String(length=1000), nullable=False),
        sa.Column("content_type", sa.String(length=255)),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_media_user_id", "media", ["user_id"])
    op.create_index("ix_media_memory_id", "media", ["memory_id"])

    op.create_table(
        "relationships",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("source_type", sa.String(length=80), nullable=False),
        sa.Column("source_id", sa.String(length=500), nullable=False),
        sa.Column("relation", sa.String(length=80), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=False),
        sa.Column("target_id", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "source_type", "source_id", "relation", "target_type", "target_id"),
    )
    op.create_index("ix_relationships_user_id", "relationships", ["user_id"])

    op.create_table(
        "timeline_events",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("memory_id", sa.String(), sa.ForeignKey("memories.id"), nullable=False),
        sa.Column("label", sa.String(length=500), nullable=False),
        sa.Column("year", sa.Integer()),
        sa.Column("date_text", sa.String(length=100)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_timeline_events_user_id", "timeline_events", ["user_id"])
    op.create_index("ix_timeline_events_memory_id", "timeline_events", ["memory_id"])
    op.create_index("ix_timeline_events_year", "timeline_events", ["year"])


def downgrade():
    op.drop_table("timeline_events")
    op.drop_table("relationships")
    op.drop_table("media")
    op.drop_table("memories")
    op.drop_table("subscriptions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
