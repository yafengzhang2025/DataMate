from pydantic import BaseModel


class OperatorRuntime(BaseModel):
    cpu: float = 0.1
    gpu: float = 0.0
    npu: float = 0.0
    memory: int = 10485760
    storage: str | None = None


class OperatorMetric(BaseModel):
    name: str
    metric: str


class OperatorOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    version: str = "1.0.0"
    category: str | None = None
    input_modal: str | None = None
    output_modal: str | None = None
    input_count: int = 1
    output_count: int = 1
    tags: list[str] = []
    runtime: dict | None = None
    settings: dict | None = None
    metrics: list[dict] | None = None
    installed: bool = True
    is_star: bool = False
    usage_count: int = 0

    class Config:
        from_attributes = True


class OperatorDetail(OperatorOut):
    readme: str | None = None


class OperatorListQuery(BaseModel):
    category: str | None = None
    modal: str | None = None
    keyword: str | None = None
    installed: bool | None = None
    page: int = 1
    size: int = 20
