import uuid
from typing import Optional, List, Dict
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task, TaskStatus


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, task_id: uuid.UUID) -> Optional[Task]:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 50) -> List[Task]:
        result = await self.db.execute(
            select(Task).order_by(Task.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_project(self, project_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Task]:
        result = await self.db.execute(
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_assigned_to_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Task]:
        result = await self.db.execute(
            select(Task)
            .where(Task.assigned_to == user_id)
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, task: Task) -> Task:
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def update(self, task: Task) -> Task:
        await self.db.flush()
        await self.db.refresh(task)
        return task

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.flush()

    async def get_all_stats(self) -> dict:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(
                func.count(Task.id).label("total"),
                func.count(case((Task.status == TaskStatus.DONE, 1))).label("done"),
                func.count(case((Task.status == TaskStatus.IN_PROGRESS, 1))).label("in_progress"),
                func.count(case((Task.status == TaskStatus.TODO, 1))).label("todo"),
                func.count(case((Task.status == TaskStatus.REVIEW, 1))).label("review"),
                func.count(case((
                    and_(Task.due_date < now, Task.status != TaskStatus.DONE, Task.due_date.isnot(None)), 1
                ))).label("overdue"),
            )
        )
        row = result.one()
        return {
            "total": row.total,
            "done": row.done,
            "in_progress": row.in_progress,
            "todo": row.todo,
            "review": row.review,
            "overdue": row.overdue,
        }

    async def get_team_performance_bulk(self) -> List[dict]:
        result = await self.db.execute(
            select(
                Task.assigned_to,
                func.count(Task.id).label("assigned"),
                func.count(case((Task.status == TaskStatus.DONE, 1))).label("completed"),
            )
            .where(Task.assigned_to.isnot(None))
            .group_by(Task.assigned_to)
        )
        return [
            {"user_id": row.assigned_to, "assigned": row.assigned, "completed": row.completed}
            for row in result
        ]

    async def get_productivity_trends_bulk(self, start: datetime, end: datetime) -> List[dict]:
        from sqlalchemy import cast, Date
        created_q = await self.db.execute(
            select(
                cast(Task.created_at, Date).label("day"),
                func.count(Task.id).label("cnt"),
            )
            .where(Task.created_at >= start, Task.created_at < end)
            .group_by(cast(Task.created_at, Date))
        )
        created_map = {str(row.day): row.cnt for row in created_q}

        completed_q = await self.db.execute(
            select(
                cast(Task.completed_at, Date).label("day"),
                func.count(Task.id).label("cnt"),
            )
            .where(Task.completed_at >= start, Task.completed_at < end, Task.completed_at.isnot(None))
            .group_by(cast(Task.completed_at, Date))
        )
        completed_map = {str(row.day): row.cnt for row in completed_q}

        return [{"created": created_map, "completed": completed_map}]

    async def count_all(self) -> int:
        result = await self.db.execute(select(func.count(Task.id)))
        return result.scalar() or 0

    async def count_by_status(self, status: TaskStatus) -> int:
        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.status == status)
        )
        return result.scalar() or 0

    async def count_overdue(self) -> int:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(Task.due_date < now, Task.status != TaskStatus.DONE, Task.due_date.isnot(None))
            )
        )
        return result.scalar() or 0

    async def get_user_completed_count(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.assigned_to == user_id, Task.status == TaskStatus.DONE)
        )
        return result.scalar() or 0

    async def get_user_assigned_count(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.assigned_to == user_id)
        )
        return result.scalar() or 0

    async def get_tasks_created_between(self, start: datetime, end: datetime) -> int:
        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.created_at >= start, Task.created_at < end)
        )
        return result.scalar() or 0

    async def get_tasks_completed_between(self, start: datetime, end: datetime) -> int:
        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.completed_at >= start, Task.completed_at < end)
        )
        return result.scalar() or 0
