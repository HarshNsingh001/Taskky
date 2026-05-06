import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.project import ProjectStatus, ProjectPriority
from app.schemas.user import UserBrief


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    priority: ProjectPriority = ProjectPriority.MEDIUM


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None


class ProjectMemberAdd(BaseModel):
    user_id: uuid.UUID


class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: uuid.UUID
    joined_at: datetime
    user: Optional[UserBrief] = None

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserBrief] = None
    member_count: Optional[int] = None
    task_count: Optional[int] = None
    completion_percentage: Optional[float] = None

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
    task_count: int = 0
    completion_percentage: float = 0.0

    model_config = {"from_attributes": True}
