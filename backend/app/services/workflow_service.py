"""Workflow service: CRUD + execution."""
import asyncio
import json
import uuid
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow import Workflow, WorkflowExecution, NodeExecution
from app.core.ws_manager import ws_manager


class WorkflowService:

    @staticmethod
    def _wf_to_dict(wf: Workflow, with_dag: bool = True) -> dict:
        d = {
            "id": wf.id,
            "name": wf.name,
            "description": wf.description,
            "status": wf.status,
            "created_at": wf.created_at,
            "updated_at": wf.updated_at,
        }
        if with_dag:
            d["nodes"] = json.loads(wf.nodes or "[]")
            d["edges"] = json.loads(wf.edges or "[]")
        return d

    async def list_workflows(
        self,
        db: AsyncSession,
        status: str | None = None,
        keyword: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> dict:
        stmt = select(Workflow)
        if status:
            stmt = stmt.where(Workflow.status == status)
        if keyword:
            stmt = stmt.where(Workflow.name.ilike(f"%{keyword}%"))
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Workflow.created_at.desc()).offset((page - 1) * size).limit(size)
        rows = (await db.execute(stmt)).scalars().all()
        return {"total": total, "items": [self._wf_to_dict(r) for r in rows]}

    async def get_workflow(self, db: AsyncSession, wf_id: str) -> dict | None:
        wf = await db.get(Workflow, wf_id)
        if not wf:
            return None
        return self._wf_to_dict(wf)

    async def create_workflow(self, db: AsyncSession, data: dict) -> dict:
        wf = Workflow(
            id=str(uuid.uuid4()),
            name=data["name"],
            description=data.get("description"),
            nodes=json.dumps(data.get("nodes", [])),
            edges=json.dumps(data.get("edges", [])),
        )
        db.add(wf)
        await db.commit()
        await db.refresh(wf)
        return self._wf_to_dict(wf)

    async def update_workflow(self, db: AsyncSession, wf_id: str, data: dict) -> dict | None:
        wf = await db.get(Workflow, wf_id)
        if not wf:
            return None
        if "name" in data and data["name"]:
            wf.name = data["name"]
        if "description" in data:
            wf.description = data["description"]
        if "nodes" in data and data["nodes"] is not None:
            wf.nodes = json.dumps(data["nodes"])
        if "edges" in data and data["edges"] is not None:
            wf.edges = json.dumps(data["edges"])
        wf.updated_at = datetime.utcnow().isoformat()
        await db.commit()
        await db.refresh(wf)
        return self._wf_to_dict(wf)

    async def delete_workflow(self, db: AsyncSession, wf_id: str) -> bool:
        wf = await db.get(Workflow, wf_id)
        if not wf:
            return False
        await db.delete(wf)
        await db.commit()
        return True

    async def run_workflow(self, db: AsyncSession, wf_id: str, run_params: dict) -> dict:
        """Create execution record and kick off async execution."""
        wf = await db.get(Workflow, wf_id)
        if not wf:
            raise ValueError("工作流不存在")

        exec_id = str(uuid.uuid4())
        execution = WorkflowExecution(
            id=exec_id,
            workflow_id=wf_id,
            status="pending",
            input_dataset_id=run_params.get("input_dataset_id"),
            output_path=run_params.get("output_path"),
            mode=run_params.get("mode", "local"),
        )
        db.add(execution)

        # Create NodeExecution records for each node
        nodes = json.loads(wf.nodes or "[]")
        for node in nodes:
            ne = NodeExecution(
                id=str(uuid.uuid4()),
                execution_id=exec_id,
                node_id=node["id"],
                operator_id=node.get("operator_id"),
                status="pending",
            )
            db.add(ne)

        wf.status = "running"
        await db.commit()

        # Fire-and-forget async execution
        asyncio.create_task(self._execute_workflow(exec_id, wf_id))

        return {"execution_id": exec_id}

    async def stop_execution(self, db: AsyncSession, exec_id: str) -> bool:
        ex = await db.get(WorkflowExecution, exec_id)
        if not ex or ex.status not in ("pending", "running"):
            return False
        ex.status = "cancelled"
        ex.finished_at = datetime.utcnow().isoformat()
        await db.commit()
        await ws_manager.send(exec_id, {"type": "execution_done", "status": "cancelled"})
        return True

    async def list_executions(
        self, db: AsyncSession, wf_id: str, page: int = 1, size: int = 20
    ) -> dict:
        stmt = (
            select(WorkflowExecution)
            .where(WorkflowExecution.workflow_id == wf_id)
            .order_by(WorkflowExecution.created_at.desc())
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one()
        stmt = stmt.offset((page - 1) * size).limit(size)
        rows = (await db.execute(stmt)).scalars().all()
        return {"total": total, "items": [self._exec_to_dict(r) for r in rows]}

    async def get_execution(self, db: AsyncSession, exec_id: str) -> dict | None:
        ex = await db.get(WorkflowExecution, exec_id)
        if not ex:
            return None
        data = self._exec_to_dict(ex)
        ne_stmt = select(NodeExecution).where(NodeExecution.execution_id == exec_id)
        nes = (await db.execute(ne_stmt)).scalars().all()
        data["node_executions"] = [self._ne_to_dict(ne) for ne in nes]
        return data

    @staticmethod
    def _exec_to_dict(ex: WorkflowExecution) -> dict:
        return {
            "id": ex.id,
            "workflow_id": ex.workflow_id,
            "status": ex.status,
            "input_dataset_id": ex.input_dataset_id,
            "output_dataset_id": ex.output_dataset_id,
            "mode": ex.mode,
            "started_at": ex.started_at,
            "finished_at": ex.finished_at,
            "created_at": ex.created_at,
        }

    @staticmethod
    def _ne_to_dict(ne: NodeExecution) -> dict:
        return {
            "id": ne.id,
            "node_id": ne.node_id,
            "operator_id": ne.operator_id,
            "status": ne.status,
            "logs": json.loads(ne.logs or "[]"),
            "metrics": json.loads(ne.metrics) if ne.metrics else None,
            "started_at": ne.started_at,
            "finished_at": ne.finished_at,
        }

    async def _execute_workflow(self, exec_id: str, wf_id: str):
        """
        Background task: run each node sequentially, push WS events.
        Real execution delegates to python-executor; here we simulate the flow.
        """
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            ex = await db.get(WorkflowExecution, exec_id)
            if not ex or ex.status == "cancelled":
                return

            ex.status = "running"
            ex.started_at = datetime.utcnow().isoformat()
            await db.commit()

            ne_stmt = select(NodeExecution).where(NodeExecution.execution_id == exec_id)
            nodes = (await db.execute(ne_stmt)).scalars().all()

            try:
                for ne in nodes:
                    if ex.status == "cancelled":
                        break
                    # Mark node running
                    ne.status = "running"
                    ne.started_at = datetime.utcnow().isoformat()
                    await db.commit()
                    await ws_manager.send(exec_id, {
                        "type": "node_status",
                        "node_id": ne.node_id,
                        "status": "running",
                        "message": f"算子 {ne.operator_id} 执行中...",
                    })

                    # Delegate to executor (placeholder: simulate work)
                    await asyncio.sleep(1)

                    ne.status = "completed"
                    ne.finished_at = datetime.utcnow().isoformat()
                    ne.metrics = json.dumps({"processed": 0, "filtered": 0, "elapsed_ms": 1000})
                    await db.commit()
                    await ws_manager.send(exec_id, {
                        "type": "node_status",
                        "node_id": ne.node_id,
                        "status": "completed",
                        "metrics": {"processed": 0, "filtered": 0, "elapsed_ms": 1000},
                    })

                final_status = "completed"
            except Exception as e:
                final_status = "error"
                await ws_manager.send(exec_id, {"type": "error", "message": str(e)})

            ex.status = final_status
            ex.finished_at = datetime.utcnow().isoformat()
            # Update parent workflow status
            wf = await db.get(Workflow, wf_id)
            if wf:
                wf.status = final_status
            await db.commit()
            await ws_manager.send(exec_id, {"type": "execution_done", "status": final_status})
