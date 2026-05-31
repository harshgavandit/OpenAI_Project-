"""Add auth fields to users table

Revision ID: 0003_add_auth_fields
Revises: 0002_add_sharing_usage
Create Date: 2026-05-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0003_add_auth_fields'
down_revision = '0002_add_sharing_usage'
branch_labels = None
depends_on = None


def upgrade():
    # Add auth-related columns to users table
    # For SQLite, we use batch mode to handle schema modifications
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('google_id', sa.String(255), nullable=True))
        batch_op.add_column(sa.Column('auth_method', sa.String(50), nullable=False, server_default='email'))


def downgrade():
    # Drop columns using batch mode for SQLite
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('auth_method')
        batch_op.drop_column('google_id')
        batch_op.drop_column('email_verified')
