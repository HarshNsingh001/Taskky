from typing import Any, Optional, Dict, List
from pydantic import BaseModel


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    success: bool
    message: str
    data: Optional[List[Any]] = None
    total: int
    page: int
    per_page: int
    total_pages: int


class ValidationErrorResponse(BaseModel):
    success: bool = False
    message: str = "Validation failed"
    errors: Dict[str, str]
