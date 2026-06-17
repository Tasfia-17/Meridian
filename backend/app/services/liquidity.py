"""
Liquidity Layer.
Aggregates A-Token transaction data from Cleanverse query_txs
and updates node/edge liquidity in the live graph snapshot.
"""
import time

from app.models.graph import NetworkSnapshot
from app.services.cleanverse import client, CleanverseError

# Live state (in-memory; production would use TimescaleDB)
_node_liquidity: dict[str, float] = {}
_corridor_volume: dict[str, float] = {}

DECIMALS = 6  # aUSDC uses 6 decimals


def _raw_to_usd(amount_str: str) -> float:
    try:
        return int(amount_str) / (10 ** DECIMALS)
    except (ValueError, TypeError):
        return 0.0


async def refresh_node_liquidity(node_id: str, chain: str, address: str) -> float:
    """Pull latest txs and compute approximate running balance."""
    try:
        result = await client.query_txs(chain=chain, address=address, symbol="ausdc", page=1, page_size=50)
        txs = result.get("txs", [])
        inflow = sum(_raw_to_usd(t["amount"]) for t in txs if t.get("to_address", "").lower() == address.lower())
        outflow = sum(_raw_to_usd(t["amount"]) for t in txs if t.get("from_address", "").lower() == address.lower())
        balance = max(0.0, inflow - outflow)
        _node_liquidity[node_id] = balance
        return balance
    except CleanverseError:
        return _node_liquidity.get(node_id, 0.0)


async def refresh_corridor_volume(corridor: str, chain: str, addresses: list[str]) -> float:
    """Aggregate 24h volume across all addresses for a corridor."""
    since = int(time.time()) - 86400
    total = 0.0
    for addr in addresses:
        try:
            result = await client.query_txs(chain=chain, address=addr, symbol="ausdc", start_time=since, page=1, page_size=100)
            for tx in result.get("txs", []):
                total += _raw_to_usd(tx["amount"])
        except CleanverseError:
            pass
    _corridor_volume[corridor] = total
    return total


def apply_liquidity_to_snapshot(snapshot: NetworkSnapshot) -> NetworkSnapshot:
    """Write cached liquidity values into the snapshot."""
    for node in snapshot.nodes:
        cached = _node_liquidity.get(node.id)
        if cached is not None:
            node.liquidity_usd = cached
    for edge in snapshot.edges:
        cached = _corridor_volume.get(edge.corridor)
        if cached is not None:
            edge.volume_24h = cached
    return snapshot


def get_corridor_utilisation(corridor: str, capacity: float) -> float:
    if capacity <= 0:
        return 0.0
    return min(1.0, _corridor_volume.get(corridor, 0.0) / capacity)


def apply_liquidity_shock(snapshot: NetworkSnapshot, node_id: str, drain_pct: float) -> NetworkSnapshot:
    """Instantly drain a node's liquidity (for simulation)."""
    for node in snapshot.nodes:
        if node.id == node_id:
            node.liquidity_usd *= (1 - drain_pct)
            _node_liquidity[node_id] = node.liquidity_usd
    return snapshot
