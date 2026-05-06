from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.task import TaskStatus
from app.models.project import ProjectStatus
from app.schemas.analytics import (
    DashboardAnalytics,
    TaskStats,
    ProjectStats,
    TeamMemberPerformance,
    ProductivityTrend,
)
from app.repositories.task_repository import TaskRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import ForbiddenException


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)

    async def get_dashboard(self, current_user: User) -> DashboardAnalytics:
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can access analytics dashboard")

        all_stats = await self.task_repo.get_all_stats()

        task_stats = TaskStats(
            total=all_stats["total"],
            completed=all_stats["done"],
            in_progress=all_stats["in_progress"],
            todo=all_stats["todo"],
            review=all_stats["review"],
            overdue=all_stats["overdue"],
        )

        project_stats = ProjectStats(
            total=await self.project_repo.count_all(),
            active=await self.project_repo.count_by_status(ProjectStatus.ACTIVE.value),
            completed=await self.project_repo.count_by_status(ProjectStatus.COMPLETED.value),
            on_hold=await self.project_repo.count_by_status(ProjectStatus.ON_HOLD.value),
        )

        perf_data = await self.task_repo.get_team_performance_bulk()
        users = await self.user_repo.get_all(limit=100)
        user_map = {u.id: u.full_name for u in users}

        team_perf = []
        for row in perf_data:
            rate = round((row["completed"] / row["assigned"]) * 100, 1) if row["assigned"] > 0 else 0.0
            team_perf.append(TeamMemberPerformance(
                user_id=str(row["user_id"]),
                full_name=user_map.get(row["user_id"], "Unknown"),
                tasks_completed=row["completed"],
                tasks_assigned=row["assigned"],
                completion_rate=rate,
            ))
        team_perf.sort(key=lambda x: x.completion_rate, reverse=True)

        now = datetime.now(timezone.utc)
        start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now + timedelta(days=1)

        trend_data = await self.task_repo.get_productivity_trends_bulk(start, end)
        created_map = trend_data[0]["created"] if trend_data else {}
        completed_map = trend_data[0]["completed"] if trend_data else {}

        trends = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_str = str(day.date())
            trends.append(ProductivityTrend(
                date=day.strftime("%a"),
                completed=completed_map.get(day_str, 0),
                added=created_map.get(day_str, 0),
            ))

        total = task_stats.total
        completed = task_stats.completed
        overall_rate = round((completed / total) * 100, 1) if total > 0 else 0.0

        return DashboardAnalytics(
            task_stats=task_stats,
            project_stats=project_stats,
            team_performance=team_perf,
            productivity_trends=trends,
            overall_completion_rate=overall_rate,
        )
