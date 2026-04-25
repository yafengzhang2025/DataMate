"""SQLAlchemy models mapping to existing t_operator* tables."""
from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Operator(Base):
    __tablename__ = "t_operator"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String, default="1.0.0")
    category: Mapped[str | None] = mapped_column(String)
    input_modal: Mapped[str | None] = mapped_column(String)
    output_modal: Mapped[str | None] = mapped_column(String)
    input_count: Mapped[int] = mapped_column(Integer, default=1)
    output_count: Mapped[int] = mapped_column(Integer, default=1)
    tags: Mapped[str] = mapped_column(Text, default="[]")  # JSON array string
    runtime: Mapped[str | None] = mapped_column(Text)       # JSON
    settings: Mapped[str | None] = mapped_column(Text)      # JSON
    metrics: Mapped[str | None] = mapped_column(Text)       # JSON
    file_name: Mapped[str] = mapped_column(String, default="")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    installed: Mapped[int] = mapped_column(Integer, default=1)
    is_star: Mapped[int] = mapped_column(Integer, default=0)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str] = mapped_column(String, default="system")
    updated_by: Mapped[str] = mapped_column(String, default="system")
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())


class OperatorCategory(Base):
    __tablename__ = "t_operator_category"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    name_en: Mapped[str | None] = mapped_column(String)
    value: Mapped[str | None] = mapped_column(String, unique=True)
    type: Mapped[str | None] = mapped_column(String)
    parent_id: Mapped[str] = mapped_column(String, default="0")
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())


class OperatorCategoryRelation(Base):
    __tablename__ = "t_operator_category_relation"

    category_id: Mapped[str] = mapped_column(String, primary_key=True)
    operator_id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())


class OperatorRelease(Base):
    __tablename__ = "t_operator_release"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    version: Mapped[str] = mapped_column(String, primary_key=True)
    release_date: Mapped[str | None] = mapped_column(String)
    changelog: Mapped[str | None] = mapped_column(Text)  # JSON array
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
