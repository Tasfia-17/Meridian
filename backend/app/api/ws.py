"""WebSocket event bus — pushes graph state to all connected frontends."""
import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect

_connections: set[WebSocket] = set()


async def connect(ws: WebSocket) -> None:
    await ws.accept()
    _connections.add(ws)


def disconnect(ws: WebSocket) -> None:
    _connections.discard(ws)


async def broadcast(data: dict) -> None:
    if not _connections:
        return
    msg = json.dumps(data)
    dead: set[WebSocket] = set()
    for ws in list(_connections):
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    _connections -= dead


async def ws_handler(ws: WebSocket) -> None:
    """Manage a single WebSocket connection lifecycle."""
    from app.services.state import get_state
    await connect(ws)
    try:
        # Send initial state immediately
        snap = get_state()
        await ws.send_text(snap.model_dump_json())
        # Keep alive — client can send pings
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        disconnect(ws)
