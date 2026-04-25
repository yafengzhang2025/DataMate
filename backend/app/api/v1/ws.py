"""WebSocket endpoint for real-time workflow execution events."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.ws_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/executions/{execution_id}")
async def ws_execution(execution_id: str, websocket: WebSocket):
    await ws_manager.connect(execution_id, websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(execution_id, websocket)
