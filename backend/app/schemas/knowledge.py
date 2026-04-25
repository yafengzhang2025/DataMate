from pydantic import BaseModel


class KnowledgeBaseCreate(BaseModel):
    name: str
    description: str | None = None
    embed_model: str = "text-embedding-3-small"
    vector_store: str = "chromadb"
    chunk_strategy: str = "fixed"
    chunk_size: int = 512
    chunk_overlap: int = 64


class KnowledgeBaseOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    embed_model: str
    vector_store: str
    chunk_strategy: str
    chunk_size: int
    chunk_overlap: int
    document_count: int = 0
    chunk_count: int = 0
    created_at: str

    class Config:
        from_attributes = True


class KbDocumentOut(BaseModel):
    id: str
    kb_id: str
    name: str
    file_type: str | None = None
    file_size: int = 0
    status: str
    chunk_count: int = 0
    error_message: str | None = None
    created_at: str

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    threshold: float = 0.7


class SearchResult(BaseModel):
    chunk_id: str
    document_name: str
    content: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]
