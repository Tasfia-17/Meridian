"""
Simulation Engine — Eisenberg-Noe cascade model.

Given an initial shock (node freeze / liquidity drain), propagates
stress through the payment network graph using fixed-point iteration.
Returns a list of timestamped snapshots (animation frames).
"""
import copy
import time
from typing import Callable

import networkx as nx

from app.models.graph import EdgeStatus, NetworkSnapshot, NodeStatus

# ── Helpers ───────────────────────────────────────────────────────────────────

def _snapshot_to_nx(snapshot: NetworkSnapshot) -> nx.DiGraph:
    G = nx.DiGraph()
    for node in snapshot.nodes:
        G.add_node(node.id, liquidity=node.liquidity_usd)
    for edge in snapshot.edges:
        G.add_edge(edge.source, edge.target, capacity=edge.capacity, volume=edge.volume_24h, edge_id=edge.id)
    return G


def _deep(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    return snapshot.model_copy(deep=True)


def _mark_blocked(snapshot: NetworkSnapshot, node_id: str) -> None:
    for n in snapshot.nodes:
        if n.id == node_id:
            n.compliance.status = NodeStatus.BLOCKED
    for e in snapshot.edges:
        if e.source == node_id or e.target == node_id:
            e.status = EdgeStatus.BLOCKED


def _propagate(snapshot: NetworkSnapshot, G: nx.DiGraph, depth: int = 3) -> list[NetworkSnapshot]:
    """
    Eisenberg-Noe fixed-point: blocked nodes cannot receive/forward liquidity.
    Returns a sequence of frames showing cascade propagation.
    """
    frames: list[NetworkSnapshot] = []
    current = _deep(snapshot)
    now = int(time.time())

    blocked = {n.id for n in current.nodes if n.compliance.status == NodeStatus.BLOCKED}

    for step in range(depth):
        new_blocked: set[str] = set()
        for node in current.nodes:
            if node.id in blocked:
                continue
            # Node stress: sum of in-flow from blocked sources
            stress = sum(
                G[pred][node.id].get("volume", 0)
                for pred in G.predecessors(node.id)
                if pred in blocked
            )
            # If stress exceeds 80% of liquidity → degraded, 100% → blocked
            if stress > 0:
                if stress >= node.liquidity_usd * 0.8:
                    new_blocked.add(node.id)
                else:
                    node.compliance.status = NodeStatus.DEGRADED

        for nid in new_blocked:
            _mark_blocked(current, nid)
        blocked |= new_blocked

        # Update edge statuses
        for e in current.edges:
            if e.source in blocked or e.target in blocked:
                e.status = EdgeStatus.BLOCKED
            elif e.source in {n.id for n in current.nodes if n.compliance.status == NodeStatus.DEGRADED}:
                e.status = EdgeStatus.DEGRADED

        frame = _deep(current)
        frame.ts = now + step + 1
        frames.append(frame)

        if not new_blocked:
            break  # stable

    return frames


# ── Scenario definitions ──────────────────────────────────────────────────────

class Scenario:
    def __init__(self, id: str, name: str, description: str, apply_fn: Callable):
        self.id = id
        self.name = name
        self.description = description
        self._apply = apply_fn

    def run(self, snapshot: NetworkSnapshot) -> list[NetworkSnapshot]:
        initial = _deep(snapshot)
        initial.ts = int(time.time())
        shocked = self._apply(initial)
        G = _snapshot_to_nx(shocked)
        frames = [shocked] + _propagate(shocked, G)
        return frames


def _scenario_sunrise_block(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """US→Nigeria corridor: Sunrise jurisdiction block on Flutterwave."""
    _mark_blocked(snapshot, "ng-flutterwave")
    return snapshot


def _scenario_liquidity_drain(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """Brazil Nubank loses 80% liquidity — corridor stress propagates."""
    for n in snapshot.nodes:
        if n.id == "br-nubank":
            n.liquidity_usd *= 0.2
    return snapshot


def _scenario_sanctions_hit(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """EU Paysafe receives sanctions flag — frozen immediately."""
    for n in snapshot.nodes:
        if n.id == "eu-paysafe":
            n.compliance.status = NodeStatus.FROZEN
            n.compliance.validator_valid = False
    for e in snapshot.edges:
        if e.source == "eu-paysafe" or e.target == "eu-paysafe":
            e.status = EdgeStatus.BLOCKED
    return snapshot


def _scenario_rule_change(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """Global min_tier raised to 60 — lower-tier nodes become DEGRADED."""
    for n in snapshot.nodes:
        if n.compliance.tier < 60:
            n.compliance.status = NodeStatus.DEGRADED
    return snapshot


def _scenario_agent_flood(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """50 treasury agents transact simultaneously — congestion cascade."""
    for e in snapshot.edges:
        if "agent" in e.source or "agent" in e.target:
            e.volume_24h = e.capacity * 0.98
            e.status = EdgeStatus.CONGESTED
    # Downstream congestion spills over
    for e in snapshot.edges:
        if e.source == "us-fed":
            e.volume_24h = min(e.capacity, e.volume_24h * 1.5)
            if e.volume_24h / e.capacity > 0.85:
                e.status = EdgeStatus.CONGESTED
    return snapshot


SCENARIOS: dict[str, Scenario] = {
    s.id: s for s in [
        Scenario("sunrise_block",   "Sunrise Block",      "Jurisdiction enforcement blocks US→Nigeria corridor", _scenario_sunrise_block),
        Scenario("liquidity_drain", "Liquidity Drain",    "Brazil corridor loses 80% of available liquidity",    _scenario_liquidity_drain),
        Scenario("sanctions_hit",   "Sanctions Hit",      "EU gateway receives sanctions designation",           _scenario_sanctions_hit),
        Scenario("rule_change",     "Compliance Rule Change", "Platform min_tier raised to 60 globally",         _scenario_rule_change),
        Scenario("agent_flood",     "AI Agent Flood",     "50 treasury agents transact simultaneously",          _scenario_agent_flood),
    ]
}


def run_scenario(scenario_id: str, snapshot: NetworkSnapshot) -> list[NetworkSnapshot]:
    scenario = SCENARIOS.get(scenario_id)
    if not scenario:
        raise ValueError(f"Unknown scenario: {scenario_id}")
    return scenario.run(snapshot)


def recommend_route(
    snapshot: NetworkSnapshot,
    from_node: str,
    to_node: str,
) -> list[str] | None:
    """
    Find the lowest-risk path between two nodes,
    avoiding BLOCKED/FROZEN nodes and edges.
    """
    G = nx.DiGraph()
    blocked_nodes = {
        n.id for n in snapshot.nodes
        if n.compliance.status in (NodeStatus.BLOCKED, NodeStatus.FROZEN)
    }
    for n in snapshot.nodes:
        if n.id not in blocked_nodes:
            G.add_node(n.id)
    for e in snapshot.edges:
        if e.status != EdgeStatus.BLOCKED and e.source not in blocked_nodes and e.target not in blocked_nodes:
            weight = 1 if e.status == EdgeStatus.HEALTHY else 3
            G.add_edge(e.source, e.target, weight=weight)

    try:
        path = nx.shortest_path(G, from_node, to_node, weight="weight")
        return path
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None
