import uuid
from typing import List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog, ActivityAction
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskAssignUpdate,
    TaskResponse,
)
from app.schemas.user import UserBrief
from app.repositories.task_repository import TaskRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.repositories.activity_repository import ActivityRepository
from app.utils.exceptions import NotFoundException, ForbiddenException


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)
        self.activity_repo = ActivityRepository(db)

    def _is_overdue(self, task: Task) -> bool:
        if task.status == TaskStatus.DONE:
            return False
        if task.due_date is None:
            return False
        return task.due_date < datetime.now(timezone.utc)

    def _build_response(self, task: Task) -> TaskResponse:
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status.value,
            priority=task.priority.value,
            due_date=task.due_date,
            project_id=task.project_id,
            assigned_to=task.assigned_to,
            created_by=task.created_by,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
            assignee=UserBrief.model_validate(task.assignee) if task.assignee else None,
            creator=UserBrief.model_validate(task.creator) if task.creator else None,
            is_overdue=self._is_overdue(task),
        )

    async def list_tasks(self, current_user: User, project_id: uuid.UUID = None, skip: int = 0, limit: int = 50) -> List[TaskResponse]:
        if project_id:
            has_access = await self.project_repo.is_user_in_project(project_id, current_user.id)
            if not has_access and current_user.role != UserRole.ADMIN:
                raise ForbiddenException("You do not have access to this project")
            tasks = await self.task_repo.get_by_project(project_id, skip, limit)
        elif current_user.role == UserRole.ADMIN:
            tasks = await self.task_repo.get_by_organization(current_user.organization_id, skip, limit)
        else:
            tasks = await self.task_repo.get_assigned_to_user(current_user.id, skip, limit)

        return [self._build_response(t) for t in tasks]

    async def get_task(self, task_id: uuid.UUID, current_user: User) -> TaskResponse:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        if current_user.role != UserRole.ADMIN:
            has_access = await self.project_repo.is_user_in_project(task.project_id, current_user.id)
            if not has_access:
                raise ForbiddenException("You do not have access to this task")

        return self._build_response(task)

    async def create_task(self, data: TaskCreate, current_user: User) -> TaskResponse:
        project = await self.project_repo.get_by_id(data.project_id)
        if not project:
            raise NotFoundException("Project")

        if current_user.role != UserRole.ADMIN:
            has_access = await self.project_repo.is_user_in_project(data.project_id, current_user.id)
            if not has_access:
                raise ForbiddenException("You do not have access to this project")

        if data.assigned_to:
            assignee = await self.user_repo.get_by_id(data.assigned_to)
            if not assignee:
                raise NotFoundException("Assignee user")

        task = Task(
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            due_date=data.due_date,
            project_id=data.project_id,
            assigned_to=data.assigned_to,
            created_by=current_user.id,
        )
        task = await self.task_repo.create(task)

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.TASK_CREATED,
            details=f"Created task '{task.title}'",
            user_id=current_user.id,
            task_id=task.id,
            project_id=task.project_id,
        ))

        task = await self.task_repo.get_by_id(task.id)
        return self._build_response(task)

    async def update_task(self, task_id: uuid.UUID, data: TaskUpdate, current_user: User) -> TaskResponse:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        if current_user.role != UserRole.ADMIN:
            has_access = await self.project_repo.is_user_in_project(task.project_id, current_user.id)
            if not has_access:
                raise ForbiddenException("You do not have access to this task")

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.priority is not None:
            task.priority = data.priority
        if data.due_date is not None:
            task.due_date = data.due_date
        if data.assigned_to is not None:
            assignee = await self.user_repo.get_by_id(data.assigned_to)
            if not assignee:
                raise NotFoundException("Assignee user")
            task.assigned_to = data.assigned_to
        if data.status is not None:
            old_status = task.status
            task.status = data.status
            if data.status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                task.completed_at = datetime.now(timezone.utc)
            elif data.status != TaskStatus.DONE:
                task.completed_at = None

        task = await self.task_repo.update(task)

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.TASK_UPDATED,
            details=f"Updated task '{task.title}'",
            user_id=current_user.id,
            task_id=task.id,
            project_id=task.project_id,
        ))

        task = await self.task_repo.get_by_id(task.id)
        return self._build_response(task)

    async def delete_task(self, task_id: uuid.UUID, current_user: User) -> None:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can delete tasks")

        if task.status != TaskStatus.TODO:
            raise ForbiddenException("Only tasks in the 'To Do' column can be deleted")

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.TASK_DELETED,
            details=f"Deleted task '{task.title}'",
            user_id=current_user.id,
            project_id=task.project_id,
        ))

        await self.task_repo.delete(task)

    async def update_status(self, task_id: uuid.UUID, data: TaskStatusUpdate, current_user: User) -> TaskResponse:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        if current_user.role != UserRole.ADMIN:
            if task.assigned_to != current_user.id:
                has_access = await self.project_repo.is_user_in_project(task.project_id, current_user.id)
                if not has_access:
                    raise ForbiddenException("You can only update status of tasks assigned to you")

        old_status = task.status
        
        VALID_TRANSITIONS = {
            TaskStatus.TODO: [TaskStatus.IN_PROGRESS],
            TaskStatus.IN_PROGRESS: [TaskStatus.TODO, TaskStatus.REVIEW],
            TaskStatus.REVIEW: [TaskStatus.IN_PROGRESS, TaskStatus.DONE],
            TaskStatus.DONE: [TaskStatus.REVIEW],
        }

        if data.status not in VALID_TRANSITIONS.get(old_status, []):
            raise ForbiddenException(f"Invalid state transition from {old_status.value} to {data.status.value}")

        task.status = data.status

        if data.status == TaskStatus.DONE and old_status != TaskStatus.DONE:
            task.completed_at = datetime.now(timezone.utc)
            await self.activity_repo.create(ActivityLog(
                action=ActivityAction.TASK_COMPLETED,
                details=f"Completed task '{task.title}'",
                user_id=current_user.id,
                task_id=task.id,
                project_id=task.project_id,
            ))
        elif data.status != TaskStatus.DONE:
            task.completed_at = None
            await self.activity_repo.create(ActivityLog(
                action=ActivityAction.STATUS_CHANGED,
                details=f"Changed task '{task.title}' status to {data.status.value}",
                user_id=current_user.id,
                task_id=task.id,
                project_id=task.project_id,
            ))

        task = await self.task_repo.update(task)
        task = await self.task_repo.get_by_id(task.id)
        return self._build_response(task)

    async def assign_task(self, task_id: uuid.UUID, data: TaskAssignUpdate, current_user: User) -> TaskResponse:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")

        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can reassign tasks")

        assignee = await self.user_repo.get_by_id(data.assigned_to)
        if not assignee:
            raise NotFoundException("Assignee user")

        task.assigned_to = data.assigned_to
        task = await self.task_repo.update(task)

        await self.activity_repo.create(ActivityLog(
            action=ActivityAction.TASK_ASSIGNED,
            details=f"Assigned task '{task.title}' to {assignee.full_name}",
            user_id=current_user.id,
            task_id=task.id,
            project_id=task.project_id,
        ))

        task = await self.task_repo.get_by_id(task.id)
        return self._build_response(task)
