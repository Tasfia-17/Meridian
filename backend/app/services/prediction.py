"""
Prediction Layer — transparent rule-based risk scoring.
No fake ML. Real signals, real thresholds, honest framing.
"""
import time
from dataclasses import dataclass, field

from app.models.graph import EdgeStatus, NetworkSnapshot, NodeStatus
from app.services.compliance import ccp_timeout_rate


@dataclass
class CorridorRisk:
    corridor: str
    score: float              # 0.0 – 1.0
    level: str                # LOW / ELEVATED / HIGH / CRITICAL
    signals: list[str] = field(default_factory=list)
    settlement_delay_min: int = 0


@dataclass
class NodeRisk:
    node_id: str
    score: float
    level: str
    signals: list[str] = field(default_factory=list)


def _level(score: float) -> str:
    if score < 0.25:
        return "LOW"
    if score < 0.5:
        return "ELEVATED"
    if score < 0.75:
        return "HIGH"
    return "CRITICAL"


def score_corridor(corridor: str, snapshot: NetworkSnapshot) -> CorridorRisk:
    signals: list[str] = []
    score = 0.0

    # Signal 1: CCP timeout rate
    timeout_rate = ccp_timeout_rate(corridor)
    if timeout_rate > 0.3:
        score += 0.4
        signals.append(f"CCP timeout rate {timeout_rate:.0%} (threshold 30%)")
    elif timeout_rate > 0.15:
        score += 0.2
        signals.append(f"CCP timeout rate {timeout_rate:.0%} elevated")

    # Signal 2: corridor edge utilisation and status
    corridor_edges = [e for e in snapshot.edges if e.corridor == corridor]
    for edge in corridor_edges:
        if edge.status == EdgeStatus.BLOCKED:
            score += 0.5
            signals.append(f"Edge {edge.id} BLOCKED")
        elif edge.status == EdgeStatus.DEGRADED:
            score += 0.25
            signals.append(f"Edge {edge.id} DEGRADED")
        elif edge.status == EdgeStatus.CONGESTED:
            score += 0.15
            signals.append(f"Edge {edge.id} CONGESTED")
        # Throughput threshold
        if edge.capacity > 0 and edge.volume_24h / edge.capacity > 0.8:
            score += 0.15
            signals.append(f"Corridor throughput at {edge.volume_24h/edge.capacity:.0%}")

    # Signal 3: node compliance states for corridor endpoints
    corridor_countries = set(corridor.split("-"))
    for node in snapshot.nodes:
        if node.country in corridor_countries:
            if node.compliance.status == NodeStatus.BLOCKED:
                score += 0.3
                signals.append(f"Node {node.label} BLOCKED")
            elif node.compliance.status in (NodeStatus.DEGRADED, NodeStatus.FROZEN):
                score += 0.15
                signals.append(f"Node {node.label} {node.compliance.status}")

    score = min(1.0, score)

    # Estimated settlement delay
    delay = 0
    if score > 0.5:
        delay = 15
    elif score > 0.25:
        delay = 5

    return CorridorRisk(
        corridor=corridor,
        score=round(score, 3),
        level=_level(score),
        signals=signals,
        settlement_delay_min=delay,
    )


def score_node(node_id: str, snapshot: NetworkSnapshot) -> NodeRisk:
    signals: list[str] = []
    score = 0.0

    node = next((n for n in snapshot.nodes if n.id == node_id), None)
    if not node:
        return NodeRisk(node_id=node_id, score=0.0, level="LOW")

    if node.compliance.status == NodeStatus.BLOCKED:
        score += 0.8
        signals.append("Node BLOCKED")
    elif node.compliance.status == NodeStatus.FROZEN:
        score += 0.7
        signals.append("Node FROZEN")
    elif node.compliance.status == NodeStatus.DEGRADED:
        score += 0.3
        signals.append("Node DEGRADED")

    if not node.compliance.validator_valid:
        score += 0.3
        signals.append("Validator check failed")

    now = int(time.time())
    if node.compliance.expiration_time:
        days_left = (node.compliance.expiration_time - now) / 86400
        if days_left < 0:
            score += 0.4
            signals.append("A-Pass expired")
        elif days_left < 30:
            score += 0.2
            signals.append(f"A-Pass expires in {int(days_left)}d")

    if node.liquidity_usd < 500_000:
        score += 0.2
        signals.append(f"Low liquidity: ${node.liquidity_usd:,.0f}")

    score = min(1.0, score)
    return NodeRisk(node_id=node_id, score=round(score, 3), level=_level(score), signals=signals)


def full_risk_report(snapshot: NetworkSnapshot) -> dict:
    corridors = list({e.corridor for e in snapshot.edges})
    corridor_risks = [score_corridor(c, snapshot) for c in corridors]
    node_risks = [score_node(n.id, snapshot) for n in snapshot.nodes]

    # Network-level health
    avg = sum(r.score for r in corridor_risks) / max(len(corridor_risks), 1)
    critical_corridors = [r for r in corridor_risks if r.level == "CRITICAL"]
    at_risk_nodes = [r for r in node_risks if r.score > 0.3]

    return {
        "ts": int(time.time()),
        "network_health": round(1.0 - avg, 3),
        "network_level": _level(avg),
        "corridor_risks": [vars(r) for r in sorted(corridor_risks, key=lambda x: -x.score)],
        "node_risks": [vars(r) for r in sorted(node_risks, key=lambda x: -x.score)],
        "critical_corridors": [r.corridor for r in critical_corridors],
        "at_risk_node_count": len(at_risk_nodes),
    }
