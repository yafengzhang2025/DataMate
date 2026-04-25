"""Knowledge base API routes."""
import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.common import ok, err
from app.schemas.knowledge import KnowledgeBaseCreate, SearchRequest
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/knowledge", tags=["knowledge"])
svc = KnowledgeService()


@router.get("")
async def list_knowledge_bases(db: AsyncSession = Depends(get_db)):
    data = await svc.list_knowledge_bases(db)
    return ok(data)


@router.post("")
async def create_knowledge_base(payload: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)):
    kb = await svc.create_knowledge_base(db, payload.model_dump())
    return ok(kb)


@router.get("/{kb_id}")
async def get_knowledge_base(kb_id: str, db: AsyncSession = Depends(get_db)):
    kb = await svc.get_knowledge_base(db, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return ok(kb)


@router.delete("/{kb_id}")
async def delete_knowledge_base(kb_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await svc.delete_knowledge_base(db, kb_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return ok({"id": kb_id})


@router.get("/{kb_id}/documents")
async def list_documents(kb_id: str, db: AsyncSession = Depends(get_db)):
    docs = await svc.list_documents(db, kb_id)
    return ok(docs)


@router.post("/{kb_id}/documents/upload")
async def upload_document(
    kb_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or "")[1]) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        doc = await svc.upload_document(db, kb_id, tmp_path, file.filename or "unnamed", len(content))
    except ValueError as e:
        os.unlink(tmp_path)
        raise HTTPException(status_code=404, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
    return ok(doc)


@router.delete("/{kb_id}/documents/{doc_id}")
async def delete_document(kb_id: str, doc_id: str, db: AsyncSession = Depends(get_db)):
    deleted = await svc.delete_document(db, kb_id, doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="文档不存在")
    return ok({"id": doc_id})


@router.post("/{kb_id}/reindex")
async def reindex(kb_id: str, db: AsyncSession = Depends(get_db)):
    ok_ = await svc.reindex(db, kb_id)
    if not ok_:
        raise HTTPException(status_code=404, detail="知识库不存在")
    return ok({"message": "重建索引已启动"})


@router.post("/{kb_id}/search")
async def search(kb_id: str, payload: SearchRequest, db: AsyncSession = Depends(get_db)):
    try:
        results = await svc.search(db, kb_id, payload.query, payload.top_k, payload.threshold)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return ok(results)
