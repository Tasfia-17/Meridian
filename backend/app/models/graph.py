from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel


class NodeStatus(str, Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    DEGRADED = "degraded"       # compliance issues but not blocked
    BLOCKED = "blocked"         # fully blocked / Sunrise


class NodeType(str, Enum):
    BANK = "bank"
    PSP = "psp"
    EXCHANGE = "exchange"
    WALLET = "wallet"
    AGENT = "agent"


class EdgeStatus(str, Enum):
    HEALTHY = "healthy"
    CONGESTED = "congested"
    DEGRADED = "degraded"
    BLOCKED = "blocked"


class ComplianceState(BaseModel):
    tier: int = 0
    status: NodeStatus = NodeStatus.ACTIVE
    apass_verified: bool = False
    validator_valid: bool = True
    expiration_time: Optional[int] = None   # unix seconds


class Node(BaseModel):
    id: str
    label: str
    type: NodeType
    country: str                            # ISO-2
    chain: str
    wallet_address: str
    compliance: ComplianceState = ComplianceState()
    liquidity_usd: float = 0.0
    throughput_24h: float = 0.0             # USD
    x: float = 0.0                         # layout hint
    y: float = 0.0


class Edge(BaseModel):
    id: str
    source: str
    target: str
    status: EdgeStatus = EdgeStatus.HEALTHY
    volume_24h: float = 0.0                 # USD
    capacity: float = 0.0                  # USD max
    latency_ms: int = 500
    corridor: str                           # e.g. "US-NG"


class NetworkSnapshot(BaseModel):
    ts: int                                 # unix seconds
    nodes: list[Node]
    edges: list[Edge]
