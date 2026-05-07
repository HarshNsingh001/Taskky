import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization


class OrganizationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, org_id: uuid.UUID) -> Optional[Organization]:
        result = await self.db.execute(select(Organization).where(Organization.id == org_id))
        return result.scalar_one_or_none()

    async def get_by_invite_code(self, invite_code: str) -> Optional[Organization]:
        result = await self.db.execute(
            select(Organization).where(Organization.invite_code == invite_code.upper().strip())
        )
        return result.scalar_one_or_none()

    async def create(self, org: Organization) -> Organization:
        self.db.add(org)
        await self.db.flush()
        await self.db.refresh(org)
        return org

    async def update(self, org: Organization) -> Organization:
        await self.db.flush()
        await self.db.refresh(org)
        return org
