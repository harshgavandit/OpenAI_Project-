"""Add MemoryGraph unique feature tables

Revision ID: 0007_add_memorygraph_unique_features
Revises: 0006_add_family_platform_features
Create Date: 2026-05-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0007_add_memorygraph_unique_features'
down_revision = '0006_add_family_platform_features'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'memory_capsules',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('unlock_type', sa.String(length=80), nullable=False),
        sa.Column('unlock_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('recipient_name', sa.String(length=200), nullable=True),
        sa.Column('recipient_email', sa.String(length=320), nullable=True),
        sa.Column('share_token', sa.String(length=96), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token'),
    )
    op.create_index(op.f('ix_memory_capsules_user_id'), 'memory_capsules', ['user_id'], unique=False)
    op.create_index(op.f('ix_memory_capsules_share_token'), 'memory_capsules', ['share_token'], unique=True)
    op.create_index(op.f('ix_memory_capsules_created_at'), 'memory_capsules', ['created_at'], unique=False)

    op.create_table(
        'family_rituals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('cadence', sa.String(length=80), nullable=False),
        sa.Column('questions_json', sa.JSON(), nullable=False),
        sa.Column('source_memory_ids_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_family_rituals_user_id'), 'family_rituals', ['user_id'], unique=False)
    op.create_index(op.f('ix_family_rituals_created_at'), 'family_rituals', ['created_at'], unique=False)

    op.create_table(
        'legacy_contacts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('relationship', sa.String(length=120), nullable=True),
        sa.Column('permissions_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_legacy_contacts_user_id'), 'legacy_contacts', ['user_id'], unique=False)
    op.create_index(op.f('ix_legacy_contacts_created_at'), 'legacy_contacts', ['created_at'], unique=False)


def downgrade():
    op.drop_table('legacy_contacts')
    op.drop_table('family_rituals')
    op.drop_table('memory_capsules')
