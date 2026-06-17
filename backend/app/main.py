import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.api import audit, cleanverse, graph, simulation
from app.api.ws import broadcast, ws_handler
from app.services.state import on_tick, tick_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register tick callback to broadcast state over WebSocket
    async def _broadcast_tick(snap):
        await broadcast({"type": "tick", **snap.model_dump()})

    on_tick(lambda snap: asyncio.create_task(_broadcast_tick(snap)))
    asyncio.create_task(tick_loop(interval=3.0))
    yield


app = FastAPI(title="Meridian API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(simulation.router)
app.include_router(cleanverse.router)
app.include_router(audit.router)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_handler(ws)


@app.get("/health")
async def health():
    return {"status": "ok"}
