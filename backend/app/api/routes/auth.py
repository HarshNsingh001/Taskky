from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest, RefreshRequest
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", status_code=201)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.signup(data)
    return success_response(
        data={
            "user": result["user"].model_dump(),
            "tokens": result["tokens"].model_dump(),
        },
        message="Account created successfully",
    )


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.login(data)
    return success_response(
        data={
            "user": result["user"].model_dump(),
            "tokens": result["tokens"].model_dump(),
        },
        message="Login successful",
    )


@router.post("/refresh")
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    tokens = await service.refresh(data)
    return success_response(data=tokens.model_dump(), message="Token refreshed successfully")


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return success_response(message="Logged out successfully")


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user = await service.get_current_user(str(current_user.id))
    return success_response(data=user.model_dump(), message="User retrieved successfully")
