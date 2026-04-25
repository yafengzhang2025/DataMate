"""Datasets API routes."""
import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, Form, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ok
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["Datasets"])
svc = DatasetService()


@router.get("")
async def list_datasets(
    modal: str | None = Query(None),
    format: str | None = Query(None),
    keyword: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return ok(await svc.list_datasets(db, modal, format, keyword, page, size))


@router.get("/{ds_id}")
async def get_dataset(ds_id: str, db: AsyncSession = Depends(get_db)):
    data = await svc.get_dataset(db, ds_id)
    if not data:
        raise HTTPException(status_code=404, detail="数据集不存在")
    return ok(data)


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str | None = Form(None),
    modal: str = Form("text"),
    db: AsyncSession = Depends(get_db),
):
    filename = file.filename or f"dataset-{uuid.uuid4()}"
    tmp_path = f"/tmp/{uuid.uuid4()}_{filename}"
    try:
        async with aiofiles.open(tmp_path, "wb") as f:
            content = await file.read()
            await f.write(content)
        result = await svc.upload_dataset(db, tmp_path, filename, name, description, modal)
        return ok(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/{ds_id}/preview")
async def preview_dataset(
    ds_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    data = await svc.preview_dataset(db, ds_id, page, size)
    if not data:
        raise HTTPException(status_code=404, detail="数据集不存在")
    return ok(data)


@router.delete("/{ds_id}")
async def delete_dataset(ds_id: str, db: AsyncSession = Depends(get_db)):
    if not await svc.delete_dataset(db, ds_id):
        raise HTTPException(status_code=404, detail="数据集不存在")
    return ok()


@router.get("/{ds_id}/export")
async def export_dataset(
    ds_id: str,
    format: str = Query("jsonl", pattern="^(jsonl|csv)$"),
    db: AsyncSession = Depends(get_db),
):
    try:
        content, media_type = await svc.export_dataset(db, ds_id, format)
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="dataset.{format}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
