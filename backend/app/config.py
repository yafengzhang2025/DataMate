import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "DataMate Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./datamate.db"

    # ── Storage ──────────────────────────────────────────
    DATA_DIR: str = "./data"
    DATASETS_DIR: str = "./data/datasets"
    OPERATORS_USER_DIR: str = "../runtime/ops/user"
    OPERATORS_BUILTIN_DIR: str = "../runtime/ops"

    # ── Executor ─────────────────────────────────────────
    EXECUTOR_MODE: str = "local"   # local | ray
    RAY_ADDRESS: str = "auto"
    MAX_CONCURRENT_TASKS: int = 10
    BATCH_SIZE: int = 100

    # ── Knowledge Base ────────────────────────────────────
    CHROMA_PERSIST_DIR: str = "./data/chromadb"
    DEFAULT_EMBED_MODEL: str = "text-embedding-3-small"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure directories exist
for d in [settings.DATA_DIR, settings.DATASETS_DIR, settings.CHROMA_PERSIST_DIR]:
    os.makedirs(d, exist_ok=True)
