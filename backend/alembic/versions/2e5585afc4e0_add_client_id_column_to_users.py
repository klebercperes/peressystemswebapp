"""add client_id column to users

Revision ID: 2e5585afc4e0
Revises: 668357605cc0
Create Date: 2025-11-21 07:55:14.206823

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2e5585afc4e0'
down_revision: Union[str, None] = '668357605cc0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add client_id column to users table
    op.add_column('users', sa.Column('client_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_client_id'), 'users', ['client_id'], unique=False)
    op.create_foreign_key(None, 'users', 'clients', ['client_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Remove client_id column from users table
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_client_id'), table_name='users')
    op.drop_column('users', 'client_id')
