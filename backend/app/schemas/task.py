from pydantic import BaseModel


class TaskOut(BaseModel):
    task_id: str
    status: str
    progress: int = 0
    message: str | None = None

    class Config:
        from_attributes = True
