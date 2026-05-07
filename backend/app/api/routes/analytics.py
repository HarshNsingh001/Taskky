from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.api.dependencies.auth import get_current_user
from app.models.user import User
from app.utils.response import success_response

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    analytics = await service.get_dashboard(current_user)
    return success_response(data=analytics.model_dump(), message="Dashboard analytics retrieved")


@router.get("/member-dashboard")
async def get_member_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_member_dashboard(current_user)
    return success_response(data=data, message="Member dashboard retrieved")
