"""Operator service: list, detail, install/uninstall, upload."""
import json
import os
import shutil
import tarfile
import uuid
import zipfile
from pathlib import Path

import yaml
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.operator import Operator
from app.models.task import AsyncTask


class OperatorService:

    @staticmethod
    def _row_to_dict(op: Operator) -> dict:
        tags = json.loads(op.tags or "[]")
        runtime = json.loads(op.runtime) if op.runtime else None
        settings_dict = json.loads(op.settings) if op.settings else None
        metrics = json.loads(op.metrics) if op.metrics else None
        return {
            "id": op.id,
            "name": op.name,
            "description": op.description,
            "version": op.version,
            "category": op.category,
            "input_modal": op.input_modal,
            "output_modal": op.output_modal,
            "input_count": op.input_count,
            "output_count": op.output_count,
            "tags": tags,
            "runtime": runtime,
            "settings": settings_dict,
            "metrics": metrics,
            "installed": bool(op.installed),
            "is_star": bool(op.is_star),
            "usage_count": op.usage_count,
        }

    async def list_operators(
        self,
        db: AsyncSession,
        category: str | None = None,
        modal: str | None = None,
        keyword: str | None = None,
        installed: bool | None = None,
        page: int = 1,
        size: int = 20,
    ) -> dict:
        stmt = select(Operator)
        conditions = []
        if category:
            conditions.append(Operator.category == category)
        if modal:
            conditions.append(
                or_(Operator.input_modal == modal, Operator.output_modal == modal)
            )
        if keyword:
            like = f"%{keyword}%"
            conditions.append(
                or_(Operator.name.ilike(like), Operator.description.ilike(like))
            )
        if installed is not None:
            conditions.append(Operator.installed == (1 if installed else 0))
        if conditions:
            stmt = stmt.where(*conditions)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one()

        stmt = stmt.offset((page - 1) * size).limit(size)
        rows = (await db.execute(stmt)).scalars().all()
        return {"total": total, "items": [self._row_to_dict(r) for r in rows]}

    async def get_operator(self, db: AsyncSession, op_id: str) -> dict | None:
        op = await db.get(Operator, op_id)
        if not op:
            return None
        data = self._row_to_dict(op)
        # Try to load README
        readme_path = Path(settings.OPERATORS_BUILTIN_DIR) / _category_dir(op.category or "") / op.id / "README.md"
        if readme_path.exists():
            data["readme"] = readme_path.read_text(encoding="utf-8")
        return data

    async def install_operator(self, db: AsyncSession, op_id: str) -> dict:
        """Mark operator as installed; create a background task record."""
        op = await db.get(Operator, op_id)
        if not op:
            raise ValueError(f"算子不存在: {op_id}")
        op.installed = 1
        task = AsyncTask(
            id=str(uuid.uuid4()),
            task_type="operator_install",
            status="completed",
            progress=100,
            message="安装成功",
            related_id=op_id,
        )
        db.add(task)
        await db.commit()
        return {"task_id": task.id}

    async def uninstall_operator(self, db: AsyncSession, op_id: str) -> None:
        op = await db.get(Operator, op_id)
        if not op:
            raise ValueError(f"算子不存在: {op_id}")
        op.installed = 0
        await db.commit()

    async def upload_operator(self, db: AsyncSession, file_path: str, filename: str) -> dict:
        """
        Unpack uploaded zip/tar.gz, parse metadata.yml, register operator.
        Returns the newly created operator id.
        """
        extract_dir = Path(settings.OPERATORS_USER_DIR) / Path(filename).stem
        extract_dir.mkdir(parents=True, exist_ok=True)

        # Unpack
        if filename.endswith(".zip"):
            with zipfile.ZipFile(file_path, "r") as zf:
                zf.extractall(extract_dir)
        elif filename.endswith((".tar.gz", ".tgz", ".tar")):
            with tarfile.open(file_path, "r:*") as tf:
                tf.extractall(extract_dir)
        else:
            raise ValueError("不支持的文件格式，请上传 .zip 或 .tar.gz")

        # Validate required files
        for required in ["__init__.py", "metadata.yml", "process.py"]:
            if not (extract_dir / required).exists():
                raise ValueError(f"算子包缺少必要文件: {required}")

        # Parse metadata
        meta = yaml.safe_load((extract_dir / "metadata.yml").read_text(encoding="utf-8"))
        op_id = meta.get("raw_id") or Path(filename).stem

        # Upsert operator record
        existing = await db.get(Operator, op_id)
        if existing:
            existing.name = meta.get("name", op_id)
            existing.description = meta.get("description")
            existing.version = meta.get("version", "1.0.0")
            existing.installed = 1
        else:
            op = Operator(
                id=op_id,
                name=meta.get("name", op_id),
                description=meta.get("description"),
                version=meta.get("version", "1.0.0"),
                category=_map_types(meta.get("types", [])),
                input_modal=meta.get("inputs") or meta.get("modal"),
                output_modal=meta.get("outputs") or meta.get("modal"),
                tags=json.dumps(["User"]),
                runtime=json.dumps(meta.get("runtime", {})),
                settings=json.dumps(meta.get("settings", {})),
                installed=1,
            )
            db.add(op)
        await db.commit()
        return {"id": op_id}


def _category_dir(category: str) -> str:
    mapping = {
        "filtering": "filter",
        "cleaning": "mapper",
        "mapping": "mapper",
        "annotation": "annotation",
        "formatting": "formatter",
        "slicing": "slicer",
    }
    return mapping.get(category, category)


def _map_types(types: list[str]) -> str:
    """Map metadata types list to DB category string."""
    if "annotation" in types:
        return "annotation"
    if "cleaning" in types:
        return "cleaning"
    return types[0] if types else "mapping"
