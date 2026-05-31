"""Add family platform feature tables

Revision ID: 0006_add_family_platform_features
Revises: 0005_add_family_readiness_tables
Create Date: 2026-05-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0006_add_family_platform_features'
down_revision = '0005_add_family_readiness_tables'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'story_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('mode', sa.String(length=80), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('next_question', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_story_sessions_user_id'), 'story_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_story_sessions_created_at'), 'story_sessions', ['created_at'], unique=False)

    op.create_table(
        'story_messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(length=30), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('extracted_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['story_sessions.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_story_messages_session_id'), 'story_messages', ['session_id'], unique=False)
    op.create_index(op.f('ix_story_messages_user_id'), 'story_messages', ['user_id'], unique=False)
    op.create_index(op.f('ix_story_messages_created_at'), 'story_messages', ['created_at'], unique=False)

    op.create_table(
        'person_profiles',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=240), nullable=False),
        sa.Column('role', sa.String(length=120), nullable=True),
        sa.Column('biography', sa.Text(), nullable=True),
        sa.Column('values_json', sa.JSON(), nullable=False),
        sa.Column('phrases_json', sa.JSON(), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name'),
    )
    op.create_index(op.f('ix_person_profiles_user_id'), 'person_profiles', ['user_id'], unique=False)

    op.create_table(
        'family_relationships',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('person_a', sa.String(length=240), nullable=False),
        sa.Column('relation', sa.String(length=80), nullable=False),
        sa.Column('person_b', sa.String(length=240), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=80), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_family_relationships_user_id'), 'family_relationships', ['user_id'], unique=False)
    op.create_index(op.f('ix_family_relationships_created_at'), 'family_relationships', ['created_at'], unique=False)

    op.create_table(
        'weekly_reports',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('recipient_type', sa.String(length=80), nullable=False),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('summary_json', sa.JSON(), nullable=False),
        sa.Column('share_token', sa.String(length=96), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token'),
    )
    op.create_index(op.f('ix_weekly_reports_user_id'), 'weekly_reports', ['user_id'], unique=False)
    op.create_index(op.f('ix_weekly_reports_created_at'), 'weekly_reports', ['created_at'], unique=False)
    op.create_index(op.f('ix_weekly_reports_share_token'), 'weekly_reports', ['share_token'], unique=True)

    op.create_table(
        'storybooks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('style', sa.String(length=80), nullable=False),
        sa.Column('source_query', sa.String(length=500), nullable=True),
        sa.Column('chapters_json', sa.JSON(), nullable=False),
        sa.Column('source_memory_ids_json', sa.JSON(), nullable=False),
        sa.Column('share_token', sa.String(length=96), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token'),
    )
    op.create_index(op.f('ix_storybooks_user_id'), 'storybooks', ['user_id'], unique=False)
    op.create_index(op.f('ix_storybooks_created_at'), 'storybooks', ['created_at'], unique=False)
    op.create_index(op.f('ix_storybooks_share_token'), 'storybooks', ['share_token'], unique=True)

    op.create_table(
        'legacy_achievements',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('achievement_key', sa.String(length=120), nullable=False),
        sa.Column('title', sa.String(length=180), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'achievement_key'),
    )
    op.create_index(op.f('ix_legacy_achievements_user_id'), 'legacy_achievements', ['user_id'], unique=False)
    op.create_index(op.f('ix_legacy_achievements_unlocked_at'), 'legacy_achievements', ['unlocked_at'], unique=False)


def downgrade():
    for table in ['legacy_achievements', 'storybooks', 'weekly_reports', 'family_relationships', 'person_profiles', 'story_messages', 'story_sessions']:
        op.drop_table(table)
