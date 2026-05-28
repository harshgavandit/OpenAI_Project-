"""Add sharing and usage tracking tables

Revision ID: 0002_add_sharing_usage
Revises: 0001_initial_saas_schema
Create Date: 2025-05-27 03:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002_add_sharing_usage'
down_revision = '0001_initial_saas_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create shares table
    op.create_table(
        'shares',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('memory_id', sa.String(), nullable=False),
        sa.Column('share_token', sa.String(64), nullable=False, unique=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, default=False),
        sa.Column('allow_download', sa.Boolean(), nullable=False, default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['memory_id'], ['memories.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_shares_user_id', 'user_id'),
        sa.Index('ix_shares_share_token', 'share_token'),
    )

    # Create usage_logs table
    op.create_table(
        'usage_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(500), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=False, default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('ix_usage_logs_user_id', 'user_id'),
        sa.Index('ix_usage_logs_action', 'action'),
        sa.Index('ix_usage_logs_created_at', 'created_at'),
    )


def downgrade():
    op.drop_index('ix_usage_logs_created_at')
    op.drop_index('ix_usage_logs_action')
    op.drop_index('ix_usage_logs_user_id')
    op.drop_table('usage_logs')
    
    op.drop_index('ix_shares_share_token')
    op.drop_index('ix_shares_user_id')
    op.drop_table('shares')
