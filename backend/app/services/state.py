"""Live graph state manager — single source of truth for the running twin."""
import asyncio
import time
from typing import Callable

from app.models.graph import NetworkSnapshot
from app.services.compliance import push_history, update_snapshot_compliance
from app.services.liquidity import apply_liquidity_to_snapshot
from app.services.seed import get_seed_snapshot

_state: NetworkSnapshot | None = None
_tick_cbs: list[Callable[[NetworkSnapshot], None]] = []


def get_state() -> NetworkSnapshot:
    global _state
    if _state is None:
        _state = get_seed_snapshot()
    return _state


def set_state(snapshot: NetworkSnapshot) -> None:
    global _state
    _state = snapshot
    push_history(snapshot)
    for cb in _tick_cbs:
        cb(snapshot)


def on_tick(cb: Callable[[NetworkSnapshot], None]) -> None:
    _tick_cbs.append(cb)


async def tick_loop(interval: float = 3.0) -> None:
    """Background task — updates compliance and liquidity, notifies subscribers."""
    while True:
        await asyncio.sleep(interval)
        snap = get_state()
        snap.ts = int(time.time())
        snap = update_snapshot_compliance(snap)
        snap = apply_liquidity_to_snapshot(snap)
        set_state(snap)
