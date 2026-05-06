import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog, ActivityAction
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectMemberAdd,
    ProjectMemberResponse,
)
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.repositories.activity_repository import ActivityRepository
from app.utils.exceptions import (
    NotFoundException,
    ForbiddenException,
    ConflictException,
)


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)
        self.activity_repo = ActivityRepository(db)

    async def list_projects(self, current_user: User, skip: int = 0, limit: int = 50) -> List[ProjectListResponse]:
        if current_user.role == UserRole.ADMIN:
            projects = await self.project_repo.get_all(skip, limit)
        else:
            projects = await self.project_repo.get_user_projects(current_user.id, skip, limit)

        if not projects:
            return []

        project_ids = [p.id for p in projects]
        bulk_stats = await self.project_repo.get_bulk_stats(project_ids)

        return [
            ProjectListResponse(
                id=p.id,
                title=p.title,
                description=p.description,
                status=p.status.value,
                priority=p.priority.value,
                owner_id=p.owner_id,
                created_at=p.created_at,
                updated_at=p.updated_at,
                member_count=bulk_stats.get(p.id, {}).get("member_count", 0),
                task_count=bulk_stats.get(p.id, {}).get("task_count", 0),
                completion_percentage=bulk_stats.get(p.id, {}).get("completion_percentage", 0.0),
            )
            for p in projects
        ]

    async def get_project(self, project_id: uuid.UUID, current_user: User) -> ProjectResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        if current_user.role != UserRole.ADMIN:
            has_access = await self.project_repo.is_user_in_project(project_id, current_user.id)
            if not has_access:
                raise ForbiddenException("You do not have access to this project")

        stats = await self.project_repo.get_bulk_stats([project_id])
        s = stats.get(project_id, {"member_count": 0, "task_count": 0, "completion_percentage": 0.0})

        from app.schemas.user import UserBrief
        return ProjectResponse(
            id=project.id,
            title=project.title,
            description=project.description,
            status=project.status.value,
            priority=project.priority.value,
            owner_id=project.owner_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            owner=UserBrief.model_validate(project.owner) if project.owner else None,
            member_count=s["member_count"],
            task_count=s["task_count"],
            completion_percentage=s["completion_percentage"],
        )

    async def create_project(self, data: ProjectCreate, current_user: User) -> ProjectResponse:
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can create projects")

        project = Project(
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            owner_id=current_user.id,
        )
        project = await self.project_repo.create(project)

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.PROJECT_CREATED,
            details=f"Created project '{project.title}'",
            user_id=current_user.id,
            project_id=project.id,
        ))

        return await self.get_project(project.id, current_user)

    async def update_project(self, project_id: uuid.UUID, data: ProjectUpdate, current_user: User) -> ProjectResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        if current_user.role != UserRole.ADMIN and project.owner_id != current_user.id:
            raise ForbiddenException("Only admins or the project owner can update this project")

        if data.title is not None:
            project.title = data.title
        if data.description is not None:
            project.description = data.description
        if data.status is not None:
            project.status = data.status
        if data.priority is not None:
            project.priority = data.priority

        project = await self.project_repo.update(project)

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.PROJECT_UPDATED,
            details=f"Updated project '{project.title}'",
            user_id=current_user.id,
            project_id=project.id,
        ))

        return await self.get_project(project.id, current_user)

    async def delete_project(self, project_id: uuid.UUID, current_user: User) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can delete projects")

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.PROJECT_DELETED,
            details=f"Deleted project '{project.title}'",
            user_id=current_user.id,
            project_id=None,
        ))

        await self.project_repo.delete(project)

    async def add_member(self, project_id: uuid.UUID, data: ProjectMemberAdd, current_user: User) -> ProjectMemberResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        if current_user.role != UserRole.ADMIN and project.owner_id != current_user.id:
            raise ForbiddenException("Only admins or the project owner can manage members")

        user = await self.user_repo.get_by_id(data.user_id)
        if not user:
            raise NotFoundException("User")

        existing = await self.project_repo.get_member(project_id, data.user_id)
        if existing:
            raise ConflictException("User is already a member of this project")

        if project.owner_id == data.user_id:
            raise ConflictException("Project owner is already part of the project")

        membership = ProjectMember(project_id=project_id, user_id=data.user_id)
        membership = await self.project_repo.add_member(membership)

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.MEMBER_INVITED,
            details=f"Added {user.full_name} to project '{project.title}'",
            user_id=current_user.id,
            project_id=project_id,
        ))

        from app.schemas.user import UserBrief
        return ProjectMemberResponse(
            id=membership.id,
            user_id=membership.user_id,
            project_id=membership.project_id,
            joined_at=membership.joined_at,
            user=UserBrief.model_validate(user),
        )

    async def get_members(self, project_id: uuid.UUID, current_user: User) -> List[ProjectMemberResponse]:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise NotFoundException("Project")

        if current_user.role != UserRole.ADMIN:
            has_access = await self.project_repo.is_user_in_project(project_id, current_user.id)
            if not has_access:
                raise ForbiddenException("You do not have access to this project")

        memberships = await self.project_repo.get_members(project_id)
        from app.schemas.user import UserBrief
        return [
            ProjectMemberResponse(
                id=m.id,
                user_id=m.user_id,
                project_id=m.project_id,
                joined_at=m.joined_at,
                user=UserBrief.model_validate(m.user) if m.user else None,
            )
            for m in memberships
        ]
