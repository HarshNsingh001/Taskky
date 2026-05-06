import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.task import TaskStatus, TaskPriority
from app.schemas.user import UserBrief


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    project_id: uuid.UUID
    assigned_to: Optional[uuid.UUID] = None

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is not None and v.tzinfo is None:
            from datetime import timezone
            v = v.replace(tzinfo=timezone.utc)
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[uuid.UUID] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskAssignUpdate(BaseModel):
    assigned_to: uuid.UUID


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    project_id: uuid.UUID
    assigned_to: Optional[uuid.UUID]
    created_by: uuid.UUID
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserBrief] = None
    creator: Optional[UserBrief] = None
    is_overdue: bool = False

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    priority: str
    due_date: Optional[datetime]
    project_id: uuid.UUID
    assigned_to: Optional[uuid.UUID]
    created_at: datetime
    is_overdue: bool = False

    model_config = {"from_attributes": True}
