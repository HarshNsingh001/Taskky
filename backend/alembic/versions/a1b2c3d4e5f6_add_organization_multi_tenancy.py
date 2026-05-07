"""add organization multi-tenancy

Revision ID: a1b2c3d4e5f6
Revises: 5c8a2b032b1c
Create Date: 2026-05-08 02:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '5c8a2b032b1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('invite_code', sa.String(20), nullable=False, unique=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 2. Create a default organization for existing data
    default_org_id = uuid.uuid4()
    op.execute(
        f"INSERT INTO organizations (id, name, invite_code, created_at, updated_at) "
        f"VALUES ('{default_org_id}', 'Default Workspace', 'TASKKY-LEGACY', NOW(), NOW())"
    )

    # 3. Add organization_id to users (nullable first for migration)
    op.add_column('users', sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True))

    # 4. Backfill all existing users to the default organization
    op.execute(f"UPDATE users SET organization_id = '{default_org_id}' WHERE organization_id IS NULL")

    # 5. Make organization_id NOT NULL and add FK
    op.alter_column('users', 'organization_id', nullable=False)
    op.create_foreign_key('fk_users_organization_id', 'users', 'organizations', ['organization_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_users_organization_id', 'users', ['organization_id'])

    # 6. Add organization_id to projects (nullable first for migration)
    op.add_column('projects', sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True))

    # 7. Backfill all existing projects to the default organization
    op.execute(f"UPDATE projects SET organization_id = '{default_org_id}' WHERE organization_id IS NULL")

    # 8. Make organization_id NOT NULL and add FK
    op.alter_column('projects', 'organization_id', nullable=False)
    op.create_foreign_key('fk_projects_organization_id', 'projects', 'organizations', ['organization_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_projects_organization_id', 'projects', ['organization_id'])


def downgrade() -> None:
    # Drop FKs and columns
    op.drop_constraint('fk_projects_organization_id', 'projects', type_='foreignkey')
    op.drop_index('ix_projects_organization_id', table_name='projects')
    op.drop_column('projects', 'organization_id')

    op.drop_constraint('fk_users_organization_id', 'users', type_='foreignkey')
    op.drop_index('ix_users_organization_id', table_name='users')
    op.drop_column('users', 'organization_id')

    op.drop_table('organizations')
