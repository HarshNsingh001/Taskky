import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserBrief


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    action: str
    details: Optional[str]
    user_id: uuid.UUID
    task_id: Optional[uuid.UUID]
    project_id: Optional[uuid.UUID]
    timestamp: datetime
    user: Optional[UserBrief] = None

    model_config = {"from_attributes": True}
