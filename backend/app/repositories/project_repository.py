import uuid
from typing import Optional, List, Dict
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task, TaskStatus


class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, project_id: uuid.UUID) -> Optional[Project]:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 50) -> List[Project]:
        result = await self.db.execute(
            select(Project).order_by(Project.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_owner(self, owner_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Project]:
        result = await self.db.execute(
            select(Project)
            .where(Project.owner_id == owner_id)
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_user_projects(self, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> List[Project]:
        owned = select(Project.id).where(Project.owner_id == user_id)
        member_of = select(ProjectMember.project_id).where(ProjectMember.user_id == user_id)

        result = await self.db.execute(
            select(Project)
            .where(Project.id.in_(owned.union(member_of)))
            .order_by(Project.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, project: Project) -> Project:
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def update(self, project: Project) -> Project:
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.flush()

    async def get_bulk_stats(self, project_ids: List[uuid.UUID]) -> Dict[uuid.UUID, dict]:
        if not project_ids:
            return {}

        member_q = await self.db.execute(
            select(
                ProjectMember.project_id,
                func.count(ProjectMember.id).label("cnt")
            )
            .where(ProjectMember.project_id.in_(project_ids))
            .group_by(ProjectMember.project_id)
        )
        member_counts = {row.project_id: row.cnt for row in member_q}

        task_q = await self.db.execute(
            select(
                Task.project_id,
                func.count(Task.id).label("total"),
                func.count(case((Task.status == TaskStatus.DONE, 1))).label("done"),
            )
            .where(Task.project_id.in_(project_ids))
            .group_by(Task.project_id)
        )

        stats: Dict[uuid.UUID, dict] = {}
        for row in task_q:
            pct = round((row.done / row.total) * 100, 1) if row.total > 0 else 0.0
            stats[row.project_id] = {"task_count": row.total, "done": row.done, "completion": pct}

        result = {}
        for pid in project_ids:
            ts = stats.get(pid, {"task_count": 0, "done": 0, "completion": 0.0})
            result[pid] = {
                "member_count": member_counts.get(pid, 0),
                "task_count": ts["task_count"],
                "completion_percentage": ts["completion"],
            }
        return result

    async def get_member_count(self, project_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(ProjectMember.id)).where(ProjectMember.project_id == project_id)
        )
        return result.scalar() or 0

    async def get_task_count(self, project_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.project_id == project_id)
        )
        return result.scalar() or 0

    async def get_completion_percentage(self, project_id: uuid.UUID) -> float:
        total_result = await self.db.execute(
            select(func.count(Task.id)).where(Task.project_id == project_id)
        )
        total = total_result.scalar() or 0
        if total == 0:
            return 0.0
        done_result = await self.db.execute(
            select(func.count(Task.id)).where(
                Task.project_id == project_id,
                Task.status == TaskStatus.DONE
            )
        )
        done = done_result.scalar() or 0
        return round((done / total) * 100, 1)

    async def add_member(self, membership: ProjectMember) -> ProjectMember:
        self.db.add(membership)
        await self.db.flush()
        await self.db.refresh(membership)
        return membership

    async def get_member(self, project_id: uuid.UUID, user_id: uuid.UUID) -> Optional[ProjectMember]:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def get_members(self, project_id: uuid.UUID) -> List[ProjectMember]:
        result = await self.db.execute(
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .order_by(ProjectMember.joined_at.desc())
        )
        return list(result.scalars().all())

    async def remove_member(self, membership: ProjectMember) -> None:
        await self.db.delete(membership)
        await self.db.flush()

    async def is_user_in_project(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        project = await self.get_by_id(project_id)
        if project and project.owner_id == user_id:
            return True
        member = await self.get_member(project_id, user_id)
        return member is not None

    async def count_all(self) -> int:
        result = await self.db.execute(select(func.count(Project.id)))
        return result.scalar() or 0

    async def count_by_status(self, status: str) -> int:
        result = await self.db.execute(
            select(func.count(Project.id)).where(Project.status == status)
        )
        return result.scalar() or 0
