from typing import Any, Optional
from app.schemas.common import APIResponse


def success_response(data: Any = None, message: str = "Success") -> dict:
    return APIResponse(success=True, message=message, data=data).model_dump()


def error_response(message: str = "An error occurred", data: Any = None) -> dict:
    return APIResponse(success=False, message=message, data=data).model_dump()
