from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy import select, and_, desc, asc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.project import Project, ProjectStatus
from app.models.activity_log import ActivityLog
from app.schemas.analytics import (
    DashboardAnalytics,
    TaskStats,
    ProjectStats,
    TeamMemberPerformance,
    ProductivityTrend,
    TodayFocus,
    TaskDistribution,
)
from app.schemas.task import TaskListResponse
from app.schemas.project import ProjectListResponse
from app.schemas.activity_log import ActivityLogResponse
from app.repositories.task_repository import TaskRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.user_repository import UserRepository
from app.utils.exceptions import ForbiddenException


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)

    async def get_dashboard(self, current_user: User) -> DashboardAnalytics:
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Only admins can access analytics dashboard")
        org_id = current_user.organization_id
        all_stats = await self.task_repo.get_org_stats(org_id)

        task_stats = TaskStats(
            total=all_stats["total"],
            completed=all_stats["done"],
            in_progress=all_stats["in_progress"],
            todo=all_stats["todo"],
            review=all_stats["review"],
            overdue=all_stats["overdue"],
        )

        project_count = len(await self.project_repo.get_by_organization(org_id, limit=1000))
        project_stats = ProjectStats(
            total=project_count,
            active=0,
            completed=0,
            on_hold=0,
        )

        perf_data = await self.task_repo.get_org_team_performance(org_id)
        users = await self.user_repo.get_by_organization(org_id, limit=100)
        user_map = {u.id: u for u in users}

        team_perf = []
        for row in perf_data:
            rate = round((row["completed"] / row["assigned"]) * 100, 1) if row["assigned"] > 0 else 0.0
            u = user_map.get(row["user_id"])
            team_perf.append(TeamMemberPerformance(
                user_id=str(row["user_id"]),
                full_name=u.full_name if u else "Unknown",
                avatar_url=None, # Update if avatar_url is added to user model
                tasks_completed=row["completed"],
                tasks_assigned=row["assigned"],
                completion_rate=rate,
            ))
        team_perf.sort(key=lambda x: x.completion_rate, reverse=True)

        now = datetime.now(timezone.utc)
        start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = now + timedelta(days=1)

        trend_data = await self.task_repo.get_org_productivity_trends(org_id, start, end)
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

        # Calculate Productivity Score
        overdue_ratio = (task_stats.overdue / total * 100) if total > 0 else 0
        score = int(overall_rate - overdue_ratio + 10)
        prod_score = max(0, min(100, score))

        # Today Focus
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        due_today_result = await self.db.execute(
            select(Task)
            .join(Project, Task.project_id == Project.id)
            .where(
                and_(Project.organization_id == org_id, Task.due_date >= start_of_day, Task.due_date < end_of_day, Task.status != TaskStatus.DONE)
            )
        )
        due_today_tasks = due_today_result.scalars().all()
        
        highest_priority_task = next(
            (t.title for t in due_today_tasks if t.priority == TaskPriority.URGENT), 
            next((t.title for t in due_today_tasks if t.priority == TaskPriority.HIGH), 
                 due_today_tasks[0].title if due_today_tasks else None)
        )
        
        workload = task_stats.in_progress * 2 + task_stats.todo * 1
        
        today_focus = TodayFocus(
            due_today=len(due_today_tasks),
            overdue=task_stats.overdue,
            highest_priority_task=highest_priority_task,
            workload_estimate_hours=workload
        )
        
        # Task Distribution
        task_distribution = TaskDistribution(
            completed=task_stats.completed,
            pending=task_stats.todo + task_stats.in_progress,
            blocked=0, # Assuming no blocked status for now
            review=task_stats.review,
            overdue=task_stats.overdue
        )

        # Upcoming Deadlines
        upcoming_q = await self.db.execute(
            select(Task)
            .join(Project, Task.project_id == Project.id)
            .where(
                and_(Project.organization_id == org_id, Task.due_date >= now, Task.status != TaskStatus.DONE)
            ).order_by(asc(Task.due_date)).limit(5)
        )
        upcoming_tasks = upcoming_q.scalars().all()
        upcoming_deadlines = [TaskListResponse.model_validate(t) for t in upcoming_tasks]
        
        # Top Projects
        projects_q = await self.db.execute(
            select(Project)
            .where(Project.organization_id == org_id)
            .order_by(desc(Project.created_at)).limit(5)
        )
        top_projects_list = projects_q.scalars().all()
        project_ids = [p.id for p in top_projects_list]
        proj_stats = await self.project_repo.get_bulk_stats(project_ids)
        
        top_projects = []
        for p in top_projects_list:
            s = proj_stats.get(p.id, {"member_count": 0, "task_count": 0, "completion_percentage": 0.0})
            resp = ProjectListResponse.model_validate(p)
            resp.member_count = s["member_count"]
            resp.task_count = s["task_count"]
            resp.completion_percentage = s["completion_percentage"]
            top_projects.append(resp)

        # Recent Activity
        activity_q = await self.db.execute(
            select(ActivityLog)
            .join(User, ActivityLog.user_id == User.id)
            .where(User.organization_id == org_id)
            .options(selectinload(ActivityLog.user))
            .order_by(desc(ActivityLog.timestamp)).limit(10)
        )
        activities = activity_q.scalars().all()
        recent_activity = [ActivityLogResponse.model_validate(a) for a in activities]
        
        # Smart Insights
        insights = []
        if overall_rate > 50:
            insights.append(f"Team is performing well with {overall_rate}% completion rate.")
        if task_stats.overdue > 0:
            insights.append(f"{task_stats.overdue} overdue tasks are affecting delivery schedules.")
        if workload > 40:
            insights.append("High workload detected. Consider reassigning tasks to prevent burnout.")
        if not insights:
            insights.append("Everything looks on track. Keep up the good work!")

        return DashboardAnalytics(
            task_stats=task_stats,
            project_stats=project_stats,
            team_performance=team_perf,
            productivity_trends=trends,
            overall_completion_rate=overall_rate,
            productivity_score=prod_score,
            today_focus=today_focus,
            task_distribution=task_distribution,
            upcoming_deadlines=upcoming_deadlines,
            top_projects=top_projects,
            recent_activity=recent_activity,
            insights=insights
        )
