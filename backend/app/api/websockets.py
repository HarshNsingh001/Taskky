import json
import logging
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("taskky.websockets")

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # Maps user ID string to single active WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        # Close existing connection for this user (prevents duplicates on reconnect)
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].close()
            except Exception:
                pass
        self.active_connections[user_id] = websocket
        logger.info(f"WebSocket connected: User {user_id}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections and self.active_connections[user_id] is websocket:
            del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: User {user_id}")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                # Remove dead connection
                self.active_connections.pop(user_id, None)

    async def broadcast(self, message: dict, exclude_user_id: Optional[str] = None):
        dead_connections = []
        for user_id, connection in self.active_connections.items():
            if exclude_user_id and user_id == exclude_user_id:
                continue
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(user_id)
        # Clean up dead connections
        for uid in dead_connections:
            self.active_connections.pop(uid, None)

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process if needed, currently we just need it for server->client pushes
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
