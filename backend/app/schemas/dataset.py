from pydantic import BaseModel


class DatasetOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    modal: str
    format: str | None = None
    record_count: int = 0
    size_bytes: int = 0
    columns: list[str] = []
    storage_path: str | None = None
    original_filename: str | None = None
    version: int = 1
    tags: list[str] = []
    created_at: str

    class Config:
        from_attributes = True


class DatasetPreview(BaseModel):
    total: int
    columns: list[str]
    rows: list[dict]


class DatasetUploadForm(BaseModel):
    name: str
    description: str | None = None
    modal: str = "text"
