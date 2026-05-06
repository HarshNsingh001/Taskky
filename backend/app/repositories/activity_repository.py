import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_log import ActivityLog


class ActivityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log: ActivityLog) -> ActivityLog:
        self.db.add(log)
        await self.db.flush()
        await self.db.refresh(log)
        return log

    async def get_by_project(self, project_id: uuid.UUID, limit: int = 50) -> List[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .where(ActivityLog.project_id == project_id)
            .order_by(ActivityLog.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: uuid.UUID, limit: int = 50) -> List[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .where(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 20) -> List[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .order_by(ActivityLog.timestamp.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
