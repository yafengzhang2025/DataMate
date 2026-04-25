"""Operators API routes."""
import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ok, err
from app.services.operator_service import OperatorService

router = APIRouter(prefix="/operators", tags=["Operators"])
svc = OperatorService()


@router.get("")
async def list_operators(
    category: str | None = Query(None),
    modal: str | None = Query(None),
    keyword: str | None = Query(None),
    installed: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    data = await svc.list_operators(db, category, modal, keyword, installed, page, size)
    return ok(data)


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.operator import OperatorCategory
    rows = (await db.execute(select(OperatorCategory))).scalars().all()
    items = [
        {"id": r.id, "name": r.name, "name_en": r.name_en, "value": r.value, "parent_id": r.parent_id}
        for r in rows
    ]
    return ok(items)


@router.get("/{op_id}")
async def get_operator(op_id: str, db: AsyncSession = Depends(get_db)):
    data = await svc.get_operator(db, op_id)
    if not data:
        raise HTTPException(status_code=404, detail="算子不存在")
    return ok(data)


@router.post("/{op_id}/install")
async def install_operator(op_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await svc.install_operator(db, op_id)
        return ok(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{op_id}/uninstall")
async def uninstall_operator(op_id: str, db: AsyncSession = Depends(get_db)):
    try:
        await svc.uninstall_operator(db, op_id)
        return ok()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/upload")
async def upload_operator(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    filename = file.filename or f"op-{uuid.uuid4()}.zip"
    tmp_path = f"/tmp/{uuid.uuid4()}_{filename}"
    try:
        async with aiofiles.open(tmp_path, "wb") as f:
            content = await file.read()
            await f.write(content)
        result = await svc.upload_operator(db, tmp_path, filename)
        return ok(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
