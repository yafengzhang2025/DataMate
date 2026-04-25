"""KnowledgeBase and KbDocument models."""
from datetime import datetime

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class KnowledgeBase(Base):
    __tablename__ = "t_knowledge_base"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    embed_model: Mapped[str] = mapped_column(String, default="text-embedding-3-small")
    # chromadb | elasticsearch
    vector_store: Mapped[str] = mapped_column(String, default="chromadb")
    collection_name: Mapped[str | None] = mapped_column(String)
    # chunking strategy
    chunk_strategy: Mapped[str] = mapped_column(String, default="fixed")
    chunk_size: Mapped[int] = mapped_column(Integer, default=512)
    chunk_overlap: Mapped[int] = mapped_column(Integer, default=64)
    document_count: Mapped[int] = mapped_column(Integer, default=0)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str] = mapped_column(String, default="system")
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())


class KbDocument(Base):
    __tablename__ = "t_kb_document"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    kb_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    file_type: Mapped[str | None] = mapped_column(String)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    storage_path: Mapped[str | None] = mapped_column(String)
    # pending | indexing | indexed | error
    status: Mapped[str] = mapped_column(String, default="pending")
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
