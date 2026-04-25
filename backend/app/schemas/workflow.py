from pydantic import BaseModel


class WorkflowNode(BaseModel):
    id: str
    operator_id: str
    label: str | None = None
    position: dict = {"x": 0, "y": 0}
    config: dict = {}


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    source_handle: str | None = None
    target_handle: str | None = None


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    nodes: list[WorkflowNode] = []
    edges: list[WorkflowEdge] = []


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    nodes: list[WorkflowNode] | None = None
    edges: list[WorkflowEdge] | None = None


class WorkflowOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    status: str
    nodes: list[dict] = []
    edges: list[dict] = []
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class WorkflowRunRequest(BaseModel):
    input_dataset_id: str | None = None
    output_path: str | None = None
    mode: str = "local"  # local | ray


class NodeExecutionOut(BaseModel):
    id: str
    node_id: str
    operator_id: str | None = None
    status: str
    logs: list[str] = []
    metrics: dict | None = None
    started_at: str | None = None
    finished_at: str | None = None

    class Config:
        from_attributes = True


class WorkflowExecutionOut(BaseModel):
    id: str
    workflow_id: str
    status: str
    input_dataset_id: str | None = None
    output_dataset_id: str | None = None
    mode: str
    started_at: str | None = None
    finished_at: str | None = None
    created_at: str
    node_executions: list[NodeExecutionOut] = []

    class Config:
        from_attributes = True
