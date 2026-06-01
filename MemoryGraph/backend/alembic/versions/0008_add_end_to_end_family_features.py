# Updated by GitHub contribution automation.
"""Add end-to-end family platform feature tables

Revision ID: 0008_add_end_to_end_family_features
Revises: 0007_add_memorygraph_unique_features
Create Date: 2026-05-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0008_add_end_to_end_family_features'
down_revision = '0007_add_memorygraph_unique_features'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'report_recipients',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('relationship', sa.String(length=120), nullable=True),
        sa.Column('cadence', sa.String(length=80), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_report_recipients_user_id'), 'report_recipients', ['user_id'], unique=False)
    op.create_index(op.f('ix_report_recipients_created_at'), 'report_recipients', ['created_at'], unique=False)

    op.create_table(
        'life_map_snapshots',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('person', sa.String(length=240), nullable=True),
        sa.Column('categories_json', sa.JSON(), nullable=False),
        sa.Column('source_memory_ids_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_life_map_snapshots_user_id'), 'life_map_snapshots', ['user_id'], unique=False)
    op.create_index(op.f('ix_life_map_snapshots_created_at'), 'life_map_snapshots', ['created_at'], unique=False)

    op.create_table(
        'family_tree_shares',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=240), nullable=False),
        sa.Column('share_token', sa.String(length=96), nullable=False),
        sa.Column('tree_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token'),
    )
    op.create_index(op.f('ix_family_tree_shares_user_id'), 'family_tree_shares', ['user_id'], unique=False)
    op.create_index(op.f('ix_family_tree_shares_share_token'), 'family_tree_shares', ['share_token'], unique=True)
    op.create_index(op.f('ix_family_tree_shares_created_at'), 'family_tree_shares', ['created_at'], unique=False)


def downgrade():
    op.drop_table('family_tree_shares')
    op.drop_table('life_map_snapshots')
    op.drop_table('report_recipients')
