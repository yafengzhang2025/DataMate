"""Aggregate API v1 router."""
from fastapi import APIRouter

from app.api.v1 import operators, workflows, datasets, knowledge, tasks, ws

api_router = APIRouter()

api_router.include_router(operators.router)
api_router.include_router(workflows.router)
api_router.include_router(datasets.router)
api_router.include_router(knowledge.router)
api_router.include_router(tasks.router)
api_router.include_router(ws.router)
