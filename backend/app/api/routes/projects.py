import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectMemberAdd
from app.services.project_service import ProjectService
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.utils.response import success_response
from app.api.websockets import manager

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("")
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    projects = await service.list_projects(current_user, skip, limit)
    return success_response(
        data=[p.model_dump() for p in projects],
        message="Projects retrieved successfully",
    )


@router.post("", status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    project = await service.create_project(data, current_user)
    await manager.broadcast({"type": "refresh_projects", "message": f"{current_user.full_name} created a new project"}, exclude_user_id=str(current_user.id))
    return success_response(data=project.model_dump(), message="Project created successfully")


@router.get("/{project_id}")
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    project = await service.get_project(project_id, current_user)
    return success_response(data=project.model_dump(), message="Project retrieved successfully")


@router.put("/{project_id}")
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    project = await service.update_project(project_id, data, current_user)
    await manager.broadcast({"type": "refresh_projects", "message": f"{current_user.full_name} updated a project"}, exclude_user_id=str(current_user.id))
    return success_response(data=project.model_dump(), message="Project updated successfully")


@router.delete("/{project_id}", status_code=200)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    await service.delete_project(project_id, current_user)
    await manager.broadcast({"type": "refresh_projects", "message": f"{current_user.full_name} deleted a project"}, exclude_user_id=str(current_user.id))
    return success_response(message="Project deleted successfully")


@router.post("/{project_id}/members", status_code=201)
async def add_member(
    project_id: uuid.UUID,
    data: ProjectMemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    member = await service.add_member(project_id, data, current_user)
    await manager.broadcast({"type": "refresh_projects", "message": f"{current_user.full_name} added a new member to a project"}, exclude_user_id=str(current_user.id))
    return success_response(data=member.model_dump(), message="Member added successfully")


@router.get("/{project_id}/members")
async def get_members(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    members = await service.get_members(project_id, current_user)
    return success_response(
        data=[m.model_dump() for m in members],
        message="Members retrieved successfully",
    )
