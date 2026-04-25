"""Async background task tracking model."""
from datetime import datetime

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AsyncTask(Base):
    __tablename__ = "t_async_task"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    # operator_install | workflow_run | dataset_index | kb_index
    task_type: Mapped[str] = mapped_column(String, nullable=False)
    # pending | running | completed | error
    status: Mapped[str] = mapped_column(String, default="pending")
    progress: Mapped[int] = mapped_column(Integer, default=0)    # 0-100
    message: Mapped[str | None] = mapped_column(Text)
    related_id: Mapped[str | None] = mapped_column(String)       # operator_id / execution_id etc.
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
