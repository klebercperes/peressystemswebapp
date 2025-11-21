"""add_services_table

Revision ID: 2802c786b647
Revises: 2e5585afc4e0
Create Date: 2025-11-21 08:24:37.076388

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2802c786b647'
down_revision: Union[str, None] = '2e5585afc4e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create services table
    op.create_table(
        'services',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('icon_name', sa.String(), nullable=True),
        sa.Column('order', sa.String(), server_default='0', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_services_id'), 'services', ['id'], unique=False)
    op.create_index(op.f('ix_services_title'), 'services', ['title'], unique=False)


def downgrade() -> None:
    # Drop services table
    op.drop_index(op.f('ix_services_title'), table_name='services')
    op.drop_index(op.f('ix_services_id'), table_name='services')
    op.drop_table('services')
