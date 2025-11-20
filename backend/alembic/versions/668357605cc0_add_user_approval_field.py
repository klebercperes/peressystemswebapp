"""add_user_approval_field

Revision ID: 668357605cc0
Revises: 585407dab022
Create Date: 2025-11-20 17:03:15.962299

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '668357605cc0'
down_revision: Union[str, None] = '585407dab022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_approved column to users table
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default='true'))
    
    # Set all existing users to approved (they were created before this feature)
    op.execute("UPDATE users SET is_approved = true WHERE is_approved IS NULL OR is_approved = false")


def downgrade() -> None:
    # Remove is_approved column
    op.drop_column('users', 'is_approved')
