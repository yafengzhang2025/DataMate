"""Dataset model."""
from datetime import datetime

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Dataset(Base):
    __tablename__ = "t_dataset"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    # text | image | audio | video | structured
    modal: Mapped[str] = mapped_column(String, default="text")
    # jsonl | csv | parquet | zip | txt
    format: Mapped[str | None] = mapped_column(String)
    record_count: Mapped[int] = mapped_column(Integer, default=0)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    columns: Mapped[str] = mapped_column(Text, default="[]")    # JSON array of column names
    storage_path: Mapped[str | None] = mapped_column(String)
    original_filename: Mapped[str | None] = mapped_column(String)
    version: Mapped[int] = mapped_column(Integer, default=1)
    tags: Mapped[str] = mapped_column(Text, default="[]")       # JSON array
    created_by: Mapped[str] = mapped_column(String, default="system")
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
