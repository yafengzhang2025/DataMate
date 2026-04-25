"""Dataset service: upload, preview, list, delete, export."""
import csv
import io
import json
import os
import uuid
from pathlib import Path

import aiofiles
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.dataset import Dataset


class DatasetService:

    @staticmethod
    def _row_to_dict(ds: Dataset) -> dict:
        return {
            "id": ds.id,
            "name": ds.name,
            "description": ds.description,
            "modal": ds.modal,
            "format": ds.format,
            "record_count": ds.record_count,
            "size_bytes": ds.size_bytes,
            "columns": json.loads(ds.columns or "[]"),
            "storage_path": ds.storage_path,
            "original_filename": ds.original_filename,
            "version": ds.version,
            "tags": json.loads(ds.tags or "[]"),
            "created_at": ds.created_at,
        }

    async def list_datasets(
        self,
        db: AsyncSession,
        modal: str | None = None,
        fmt: str | None = None,
        keyword: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> dict:
        stmt = select(Dataset)
        if modal:
            stmt = stmt.where(Dataset.modal == modal)
        if fmt:
            stmt = stmt.where(Dataset.format == fmt)
        if keyword:
            stmt = stmt.where(
                or_(Dataset.name.ilike(f"%{keyword}%"), Dataset.description.ilike(f"%{keyword}%"))
            )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Dataset.created_at.desc()).offset((page - 1) * size).limit(size)
        rows = (await db.execute(stmt)).scalars().all()
        return {"total": total, "items": [self._row_to_dict(r) for r in rows]}

    async def get_dataset(self, db: AsyncSession, ds_id: str) -> dict | None:
        ds = await db.get(Dataset, ds_id)
        return self._row_to_dict(ds) if ds else None

    async def upload_dataset(
        self,
        db: AsyncSession,
        file_path: str,
        filename: str,
        name: str,
        description: str | None,
        modal: str,
    ) -> dict:
        ds_id = str(uuid.uuid4())
        dest_dir = Path(settings.DATASETS_DIR) / ds_id
        dest_dir.mkdir(parents=True, exist_ok=True)

        suffix = Path(filename).suffix.lstrip(".")
        dest_path = dest_dir / f"data.{suffix}"
        import shutil
        shutil.copy2(file_path, dest_path)

        # Parse to get columns and record count
        columns, record_count = _inspect_file(str(dest_path), suffix)

        # Convert to unified jsonl
        jsonl_path = dest_dir / "data.jsonl"
        _convert_to_jsonl(str(dest_path), str(jsonl_path), suffix)

        file_size = os.path.getsize(str(dest_path))

        ds = Dataset(
            id=ds_id,
            name=name,
            description=description,
            modal=modal,
            format=suffix,
            record_count=record_count,
            size_bytes=file_size,
            columns=json.dumps(columns),
            storage_path=str(jsonl_path),
            original_filename=filename,
        )
        db.add(ds)
        await db.commit()
        await db.refresh(ds)
        return self._row_to_dict(ds)

    async def preview_dataset(
        self, db: AsyncSession, ds_id: str, page: int = 1, size: int = 20
    ) -> dict | None:
        ds = await db.get(Dataset, ds_id)
        if not ds:
            return None
        columns = json.loads(ds.columns or "[]")
        rows = _read_jsonl_page(ds.storage_path or "", page, size)
        return {"total": ds.record_count, "columns": columns, "rows": rows}

    async def delete_dataset(self, db: AsyncSession, ds_id: str) -> bool:
        ds = await db.get(Dataset, ds_id)
        if not ds:
            return False
        # Remove files
        import shutil
        ds_dir = Path(settings.DATASETS_DIR) / ds_id
        if ds_dir.exists():
            shutil.rmtree(ds_dir)
        await db.delete(ds)
        await db.commit()
        return True

    async def export_dataset(self, db: AsyncSession, ds_id: str, fmt: str) -> tuple[bytes, str]:
        """Return (file_bytes, media_type)."""
        ds = await db.get(Dataset, ds_id)
        if not ds:
            raise ValueError("数据集不存在")
        rows = _read_jsonl_all(ds.storage_path or "")
        if fmt == "csv":
            content = _rows_to_csv(rows)
            return content, "text/csv"
        # default: jsonl
        lines = "\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
        return lines.encode(), "application/x-ndjson"


# ── helpers ──────────────────────────────────────────────────────────────────

def _inspect_file(path: str, suffix: str) -> tuple[list[str], int]:
    """Return (columns, record_count)."""
    try:
        if suffix in ("jsonl", "ndjson"):
            lines = Path(path).read_text(encoding="utf-8").strip().splitlines()
            if lines:
                sample = json.loads(lines[0])
                return list(sample.keys()), len(lines)
            return [], 0
        if suffix == "csv":
            with open(path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                cols = list(reader.fieldnames or [])
                return cols, len(rows)
        if suffix == "txt":
            lines = Path(path).read_text(encoding="utf-8").strip().splitlines()
            return ["text"], len(lines)
    except Exception:
        pass
    return [], 0


def _convert_to_jsonl(src: str, dst: str, suffix: str):
    """Convert source file to jsonl format."""
    if suffix in ("jsonl", "ndjson"):
        import shutil; shutil.copy2(src, dst); return
    rows: list[dict] = []
    if suffix == "csv":
        with open(src, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = [dict(r) for r in reader]
    elif suffix == "txt":
        lines = Path(src).read_text(encoding="utf-8").strip().splitlines()
        rows = [{"text": l} for l in lines]
    with open(dst, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def _read_jsonl_page(path: str, page: int, size: int) -> list[dict]:
    try:
        lines = Path(path).read_text(encoding="utf-8").strip().splitlines()
        start = (page - 1) * size
        return [json.loads(l) for l in lines[start: start + size] if l.strip()]
    except Exception:
        return []


def _read_jsonl_all(path: str) -> list[dict]:
    try:
        lines = Path(path).read_text(encoding="utf-8").strip().splitlines()
        return [json.loads(l) for l in lines if l.strip()]
    except Exception:
        return []


def _rows_to_csv(rows: list[dict]) -> bytes:
    if not rows:
        return b""
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().encode("utf-8")
