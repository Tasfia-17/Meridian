"""
Compliance State Engine.
Derives NodeStatus and EdgeStatus from A-Pass tier/status
and Validator verify results. Also tracks CCP timeout signals
for the prediction layer.
"""
import time
from collections import deque
from typing import Deque

from app.models.graph import ComplianceState, EdgeStatus, NetworkSnapshot, NodeStatus

# Rolling window of CCP events per corridor (last 100)
_ccp_events: dict[str, Deque[dict]] = {}
# History snapshots for time-travel
_snapshot_history: list[NetworkSnapshot] = []

MIN_TIER_ACTIVE = 30        # below this → DEGRADED
MIN_TIER_BLOCKED = 10       # below this → BLOCKED
EXPIRY_BUFFER_SECS = 3600   # warn 1h before expiry


def apply_compliance(state: ComplianceState, now: int | None = None) -> NodeStatus:
    """Derive NodeStatus from A-Pass compliance state."""
    if now is None:
        now = int(time.time())
    if state.status == NodeStatus.FROZEN:
        return NodeStatus.FROZEN
    if not state.validator_valid:
        return NodeStatus.BLOCKED
    if state.expiration_time and state.expiration_time < now:
        return NodeStatus.BLOCKED
    if state.tier < MIN_TIER_BLOCKED:
        return NodeStatus.BLOCKED
    if state.tier < MIN_TIER_ACTIVE:
        return NodeStatus.DEGRADED
    if state.expiration_time and state.expiration_time < (now + EXPIRY_BUFFER_SECS):
        return NodeStatus.DEGRADED
    return NodeStatus.ACTIVE


def update_snapshot_compliance(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """Re-derive all node and edge statuses from current compliance data."""
    now = int(time.time())
    node_status: dict[str, NodeStatus] = {}

    for node in snapshot.nodes:
        node.compliance.status = apply_compliance(node.compliance, now)
        node_status[node.id] = node.compliance.status

    for edge in snapshot.edges:
        src = node_status.get(edge.source, NodeStatus.ACTIVE)
        tgt = node_status.get(edge.target, NodeStatus.ACTIVE)
        if src == NodeStatus.BLOCKED or tgt == NodeStatus.BLOCKED:
            edge.status = EdgeStatus.BLOCKED
        elif src in (NodeStatus.FROZEN, NodeStatus.DEGRADED) or tgt in (NodeStatus.FROZEN, NodeStatus.DEGRADED):
            edge.status = EdgeStatus.DEGRADED
        else:
            # utilisation-based congestion
            if edge.capacity > 0 and edge.volume_24h / edge.capacity > 0.85:
                edge.status = EdgeStatus.CONGESTED
            else:
                edge.status = EdgeStatus.HEALTHY

    return snapshot


def record_ccp_event(corridor: str, success: bool, latency_ms: int) -> None:
    """Record a CCP transaction outcome for the prediction layer."""
    if corridor not in _ccp_events:
        _ccp_events[corridor] = deque(maxlen=100)
    _ccp_events[corridor].append({
        "ts": int(time.time()),
        "success": success,
        "latency_ms": latency_ms,
    })


def ccp_timeout_rate(corridor: str, window: int = 20) -> float:
    """Return fraction of last `window` events that failed."""
    events = list(_ccp_events.get(corridor, []))[-window:]
    if not events:
        return 0.0
    return sum(1 for e in events if not e["success"]) / len(events)


def push_history(snapshot: NetworkSnapshot) -> None:
    _snapshot_history.append(snapshot)
    if len(_snapshot_history) > 500:
        _snapshot_history.pop(0)


def get_history(since_ts: int | None = None) -> list[NetworkSnapshot]:
    if since_ts is None:
        return list(_snapshot_history)
    return [s for s in _snapshot_history if s.ts >= since_ts]
