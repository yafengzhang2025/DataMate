"""Workflows API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ok
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowRunRequest
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows", tags=["Workflows"])
svc = WorkflowService()


@router.get("")
async def list_workflows(
    status: str | None = Query(None),
    keyword: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return ok(await svc.list_workflows(db, status, keyword, page, size))


@router.post("")
async def create_workflow(body: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    return ok(await svc.create_workflow(db, body.model_dump()))


@router.get("/{wf_id}")
async def get_workflow(wf_id: str, db: AsyncSession = Depends(get_db)):
    data = await svc.get_workflow(db, wf_id)
    if not data:
        raise HTTPException(status_code=404, detail="工作流不存在")
    return ok(data)


@router.put("/{wf_id}")
async def update_workflow(wf_id: str, body: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    data = await svc.update_workflow(db, wf_id, body.model_dump(exclude_none=True))
    if not data:
        raise HTTPException(status_code=404, detail="工作流不存在")
    return ok(data)


@router.delete("/{wf_id}")
async def delete_workflow(wf_id: str, db: AsyncSession = Depends(get_db)):
    if not await svc.delete_workflow(db, wf_id):
        raise HTTPException(status_code=404, detail="工作流不存在")
    return ok()


@router.post("/{wf_id}/run")
async def run_workflow(wf_id: str, body: WorkflowRunRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await svc.run_workflow(db, wf_id, body.model_dump())
        return ok(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{wf_id}/executions")
async def list_executions(
    wf_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return ok(await svc.list_executions(db, wf_id, page, size))


@router.get("/{wf_id}/executions/{exec_id}")
async def get_execution(wf_id: str, exec_id: str, db: AsyncSession = Depends(get_db)):
    data = await svc.get_execution(db, exec_id)
    if not data:
        raise HTTPException(status_code=404, detail="执行记录不存在")
    return ok(data)


@router.post("/{wf_id}/executions/{exec_id}/stop")
async def stop_execution(wf_id: str, exec_id: str, db: AsyncSession = Depends(get_db)):
    if not await svc.stop_execution(db, exec_id):
        raise HTTPException(status_code=400, detail="执行记录不存在或已结束")
    return ok()
