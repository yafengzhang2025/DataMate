"""Common response schemas."""
from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: T | None = None


class PageData(BaseModel, Generic[T]):
    total: int
    items: list[T]


def ok(data: Any = None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


def err(code: int, message: str) -> dict:
    return {"code": code, "message": message, "data": None}
