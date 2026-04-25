"""Async task status API."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task import AsyncTask
from app.schemas.common import ok

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(AsyncTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return ok({
        "id": task.id,
        "task_type": task.task_type,
        "status": task.status,
        "result": task.result,
        "error": task.error,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    })
