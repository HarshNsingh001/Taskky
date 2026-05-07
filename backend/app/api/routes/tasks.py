import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskAssignUpdate
from app.services.task_service import TaskService
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.utils.response import success_response
from app.api.websockets import manager

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("")
async def list_tasks(
    project_id: Optional[uuid.UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    tasks = await service.list_tasks(current_user, project_id, skip, limit)
    return success_response(
        data=[t.model_dump() for t in tasks],
        message="Tasks retrieved successfully",
    )


@router.post("", status_code=201)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    task = await service.create_task(data, current_user)
    await manager.broadcast({"type": "refresh_tasks", "message": f"{current_user.full_name} created a new task"}, exclude_user_id=str(current_user.id))
    return success_response(data=task.model_dump(), message="Task created successfully")


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    task = await service.get_task(task_id, current_user)
    return success_response(data=task.model_dump(), message="Task retrieved successfully")


@router.put("/{task_id}")
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    task = await service.update_task(task_id, data, current_user)
    await manager.broadcast({"type": "refresh_tasks", "message": f"{current_user.full_name} updated a task"}, exclude_user_id=str(current_user.id))
    return success_response(data=task.model_dump(), message="Task updated successfully")


@router.delete("/{task_id}", status_code=200)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    await service.delete_task(task_id, current_user)
    await manager.broadcast({"type": "refresh_tasks", "message": f"{current_user.full_name} deleted a task"}, exclude_user_id=str(current_user.id))
    return success_response(message="Task deleted successfully")


@router.patch("/{task_id}/status")
async def update_task_status(
    task_id: uuid.UUID,
    data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    task = await service.update_status(task_id, data, current_user)

    task_data = task.model_dump()

    # Targeted notifications based on workflow
    if data.status == "review":
        # Member submitted for review → notify admins
        from app.repositories.user_repository import UserRepository
        user_repo = UserRepository(db)
        admins = await user_repo.get_org_admins(current_user.organization_id)
        for admin in admins:
            await manager.send_personal_message(
                {"type": "refresh_tasks", "message": f"📋 {current_user.full_name} submitted '{task_data['title']}' for review"},
                str(admin.id)
            )
    elif data.status == "todo" and task_data.get("assigned_to"):
        # Admin sent task back to TODO → notify assigned member
        revision = task_data.get("revision_count", 0)
        await manager.send_personal_message(
            {"type": "refresh_tasks", "message": f"🔁 Task '{task_data['title']}' sent back for revision #{revision}"},
            str(task_data["assigned_to"])
        )
    elif data.status == "done" and task_data.get("assigned_to"):
        # Admin approved → notify assigned member
        await manager.send_personal_message(
            {"type": "refresh_tasks", "message": f"✅ Task '{task_data['title']}' approved and completed!"},
            str(task_data["assigned_to"])
        )
    else:
        # Generic broadcast for other transitions
        await manager.broadcast(
            {"type": "refresh_tasks", "message": f"{current_user.full_name} changed task status to {data.status}"},
            exclude_user_id=str(current_user.id)
        )

    return success_response(data=task_data, message="Task status updated successfully")


@router.patch("/{task_id}/assign")
async def assign_task(
    task_id: uuid.UUID,
    data: TaskAssignUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TaskService(db)
    task = await service.assign_task(task_id, data, current_user)
    await manager.broadcast({"type": "refresh_tasks", "message": f"{current_user.full_name} re-assigned a task"}, exclude_user_id=str(current_user.id))
    return success_response(data=task.model_dump(), message="Task assigned successfully")
