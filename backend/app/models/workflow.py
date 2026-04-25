"""Workflow, WorkflowExecution, NodeExecution models."""
from datetime import datetime

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Workflow(Base):
    __tablename__ = "t_workflow"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    # draft | running | completed | error | cancelled
    status: Mapped[str] = mapped_column(String, default="draft")
    nodes: Mapped[str] = mapped_column(Text, default="[]")   # JSON array
    edges: Mapped[str] = mapped_column(Text, default="[]")   # JSON array
    created_by: Mapped[str] = mapped_column(String, default="system")
    updated_by: Mapped[str] = mapped_column(String, default="system")
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())


class WorkflowExecution(Base):
    __tablename__ = "t_workflow_execution"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    workflow_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    # pending | running | completed | error | cancelled
    status: Mapped[str] = mapped_column(String, default="pending")
    input_dataset_id: Mapped[str | None] = mapped_column(String)
    output_dataset_id: Mapped[str | None] = mapped_column(String)
    output_path: Mapped[str | None] = mapped_column(String)
    mode: Mapped[str] = mapped_column(String, default="local")  # local | ray
    started_at: Mapped[str | None] = mapped_column(String)
    finished_at: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())


class NodeExecution(Base):
    __tablename__ = "t_node_execution"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    execution_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    node_id: Mapped[str] = mapped_column(String, nullable=False)
    operator_id: Mapped[str | None] = mapped_column(String)
    # pending | running | completed | error
    status: Mapped[str] = mapped_column(String, default="pending")
    logs: Mapped[str] = mapped_column(Text, default="[]")     # JSON array of log strings
    metrics: Mapped[str | None] = mapped_column(Text)         # JSON {processed, filtered, elapsed_ms}
    started_at: Mapped[str | None] = mapped_column(String)
    finished_at: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[str] = mapped_column(String, default=lambda: datetime.utcnow().isoformat())
