import json
import logging
from typing import List, Set, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("smartpark.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return

        dead_connections = set()
        text_data = json.dumps(message)

        for connection in self.active_connections:
            try:
                await connection.send_text(text_data)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    async def broadcast_slots_update(self, slots: List[Dict[str, Any]]):
        await self.broadcast({
            "type": "SLOTS_UPDATE",
            "slots": slots,
        })

    async def broadcast_reservations_update(self, reservations: List[Dict[str, Any]]):
        await self.broadcast({
            "type": "RESERVATIONS_UPDATE",
            "reservations": reservations,
        })

    async def broadcast_event(self, event: Dict[str, Any]):
        await self.broadcast({
            "type": "SYSTEM_EVENT",
            "event": event,
        })


ws_manager = ConnectionManager()
