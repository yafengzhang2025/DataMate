"""WebSocket connection manager for execution log streaming."""
import json
from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        # execution_id -> list of active connections
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, execution_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[execution_id].append(websocket)

    def disconnect(self, execution_id: str, websocket: WebSocket):
        conns = self._connections.get(execution_id, [])
        if websocket in conns:
            conns.remove(websocket)

    async def send(self, execution_id: str, message: dict):
        """Send JSON message to all subscribers of execution_id."""
        payload = json.dumps(message, ensure_ascii=False)
        dead = []
        for ws in self._connections.get(execution_id, []):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(execution_id, ws)


ws_manager = WebSocketManager()
