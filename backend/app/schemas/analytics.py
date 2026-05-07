from pydantic import BaseModel
from typing import List, Optional


from app.schemas.project import ProjectListResponse
from app.schemas.task import TaskListResponse
from app.schemas.activity_log import ActivityLogResponse

class TaskStats(BaseModel):
    total: int
    completed: int
    in_progress: int
    todo: int
    review: int
    overdue: int


class ProjectStats(BaseModel):
    total: int
    active: int
    completed: int
    on_hold: int


class TeamMemberPerformance(BaseModel):
    user_id: str
    full_name: str
    avatar_url: Optional[str] = None
    tasks_completed: int
    tasks_assigned: int
    completion_rate: float


class ProductivityTrend(BaseModel):
    date: str
    completed: int
    added: int


class TodayFocus(BaseModel):
    due_today: int
    overdue: int
    highest_priority_task: Optional[str] = None
    workload_estimate_hours: int


class TaskDistribution(BaseModel):
    completed: int
    pending: int
    blocked: int
    review: int
    overdue: int


class DashboardAnalytics(BaseModel):
    task_stats: TaskStats
    project_stats: ProjectStats
    team_performance: List[TeamMemberPerformance]
    productivity_trends: List[ProductivityTrend]
    overall_completion_rate: float
    productivity_score: int
    today_focus: TodayFocus
    task_distribution: TaskDistribution
    upcoming_deadlines: List[TaskListResponse]
    top_projects: List[ProjectListResponse]
    recent_activity: List[ActivityLogResponse]
    insights: List[str]
