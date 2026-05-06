from pydantic import BaseModel
from typing import List, Optional


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
    tasks_completed: int
    tasks_assigned: int
    completion_rate: float


class ProductivityTrend(BaseModel):
    date: str
    completed: int
    added: int


class DashboardAnalytics(BaseModel):
    task_stats: TaskStats
    project_stats: ProjectStats
    team_performance: List[TeamMemberPerformance]
    productivity_trends: List[ProductivityTrend]
    overall_completion_rate: float
