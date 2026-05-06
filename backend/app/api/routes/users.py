from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.utils.response import success_response

from app.schemas.user import UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.put("/me")
async def update_current_user(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
        
    updated_user = await repo.update(current_user)
    await db.commit()
    
    return success_response(
        data=UserResponse.model_validate(updated_user).model_dump(mode="json"),
        message="Profile updated successfully"
    )

@router.get("")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    users = await repo.get_all(skip, limit)
    return success_response(
        data=[{"id": str(u.id), "full_name": u.full_name, "email": u.email, "role": u.role.value} for u in users],
        message="Users retrieved successfully"
    )
