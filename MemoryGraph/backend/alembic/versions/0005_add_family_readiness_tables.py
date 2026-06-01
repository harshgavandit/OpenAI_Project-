# Updated by GitHub contribution automation.
"""Add family readiness tables and memory lifecycle fields

Revision ID: 0005_add_family_readiness_tables
Revises: 0004_add_sessions_table
Create Date: 2026-05-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0005_add_family_readiness_tables'
down_revision = '0004_add_sessions_table'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('memories') as batch_op:
        batch_op.add_column(sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('delete_reason', sa.Text(), nullable=True))

    op.create_table(
        'feedback_entries',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('email', sa.String(length=320), nullable=True),
        sa.Column('usefulness', sa.String(length=100), nullable=False),
        sa.Column('feedback_type', sa.String(length=100), nullable=False),
        sa.Column('standout_experience', sa.String(length=150), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_feedback_entries_user_id'), 'feedback_entries', ['user_id'], unique=False)
    op.create_index(op.f('ix_feedback_entries_created_at'), 'feedback_entries', ['created_at'], unique=False)

    op.create_table(
        'contact_messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('reason', sa.String(length=120), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_contact_messages_user_id'), 'contact_messages', ['user_id'], unique=False)
    op.create_index(op.f('ix_contact_messages_created_at'), 'contact_messages', ['created_at'], unique=False)

    op.create_table(
        'invite_links',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('invite_token', sa.String(length=96), nullable=False),
        sa.Column('recipient_email', sa.String(length=320), nullable=True),
        sa.Column('recipient_name', sa.String(length=200), nullable=True),
        sa.Column('relationship', sa.String(length=120), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('invite_token'),
    )
    op.create_index(op.f('ix_invite_links_user_id'), 'invite_links', ['user_id'], unique=False)
    op.create_index(op.f('ix_invite_links_invite_token'), 'invite_links', ['invite_token'], unique=True)
    op.create_index(op.f('ix_invite_links_created_at'), 'invite_links', ['created_at'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_invite_links_created_at'), table_name='invite_links')
    op.drop_index(op.f('ix_invite_links_invite_token'), table_name='invite_links')
    op.drop_index(op.f('ix_invite_links_user_id'), table_name='invite_links')
    op.drop_table('invite_links')

    op.drop_index(op.f('ix_contact_messages_created_at'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_user_id'), table_name='contact_messages')
    op.drop_table('contact_messages')

    op.drop_index(op.f('ix_feedback_entries_created_at'), table_name='feedback_entries')
    op.drop_index(op.f('ix_feedback_entries_user_id'), table_name='feedback_entries')
    op.drop_table('feedback_entries')

    with op.batch_alter_table('memories') as batch_op:
        batch_op.drop_column('delete_reason')
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('archived_at')
