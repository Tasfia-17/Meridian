"""
Synthetic corridor seed data — 5 geographic hubs with realistic
liquidity, throughput, and compliance attributes.
Positions are normalised for a 1200x800 canvas.
"""
from app.models.graph import (
    ComplianceState, Edge, EdgeStatus, NetworkSnapshot, Node, NodeStatus, NodeType
)
import time

NODES: list[Node] = [
    Node(
        id="us-fed",
        label="US Federal Reserve PSP",
        type=NodeType.BANK,
        country="US",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000001",
        compliance=ComplianceState(tier=90, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=50_000_000,
        throughput_24h=12_000_000,
        x=100, y=300,
    ),
    Node(
        id="us-circle",
        label="Circle US Gateway",
        type=NodeType.PSP,
        country="US",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000002",
        compliance=ComplianceState(tier=80, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=30_000_000,
        throughput_24h=8_000_000,
        x=200, y=200,
    ),
    Node(
        id="eu-seba",
        label="SEBA Bank EU",
        type=NodeType.BANK,
        country="DE",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000003",
        compliance=ComplianceState(tier=85, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=40_000_000,
        throughput_24h=9_500_000,
        x=500, y=150,
    ),
    Node(
        id="eu-paysafe",
        label="Paysafe EU",
        type=NodeType.PSP,
        country="GB",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000004",
        compliance=ComplianceState(tier=70, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=20_000_000,
        throughput_24h=5_000_000,
        x=450, y=250,
    ),
    Node(
        id="br-nubank",
        label="Nubank Brazil",
        type=NodeType.PSP,
        country="BR",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000005",
        compliance=ComplianceState(tier=60, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=15_000_000,
        throughput_24h=4_000_000,
        x=300, y=550,
    ),
    Node(
        id="ng-flutterwave",
        label="Flutterwave Nigeria",
        type=NodeType.PSP,
        country="NG",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000006",
        compliance=ComplianceState(tier=55, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=8_000_000,
        throughput_24h=2_500_000,
        x=600, y=500,
    ),
    Node(
        id="vn-momo",
        label="MoMo Vietnam",
        type=NodeType.PSP,
        country="VN",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000007",
        compliance=ComplianceState(tier=50, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=6_000_000,
        throughput_24h=1_800_000,
        x=950, y=400,
    ),
    Node(
        id="vn-tpbank",
        label="TPBank Vietnam",
        type=NodeType.BANK,
        country="VN",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000008",
        compliance=ComplianceState(tier=45, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=5_000_000,
        throughput_24h=1_200_000,
        x=1050, y=350,
    ),
    # AI treasury agents
    Node(
        id="agent-treasury-us",
        label="Treasury Agent (US)",
        type=NodeType.AGENT,
        country="US",
        chain="base",
        wallet_address="0x0000000000000000000000000000000000000009",
        compliance=ComplianceState(tier=40, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=2_000_000,
        throughput_24h=800_000,
        x=150, y=400,
    ),
    Node(
        id="agent-settlement-eu",
        label="Settlement Agent (EU)",
        type=NodeType.AGENT,
        country="DE",
        chain="base",
        wallet_address="0x000000000000000000000000000000000000000a",
        compliance=ComplianceState(tier=40, status=NodeStatus.ACTIVE, apass_verified=True, validator_valid=True),
        liquidity_usd=1_500_000,
        throughput_24h=600_000,
        x=600, y=200,
    ),
]

EDGES: list[Edge] = [
    Edge(id="us-fed→us-circle",  source="us-fed",     target="us-circle",    status=EdgeStatus.HEALTHY,   volume_24h=8_000_000,  capacity=20_000_000, latency_ms=120,  corridor="US-US"),
    Edge(id="us-circle→eu-seba", source="us-circle",  target="eu-seba",      status=EdgeStatus.HEALTHY,   volume_24h=5_000_000,  capacity=15_000_000, latency_ms=800,  corridor="US-EU"),
    Edge(id="us-circle→br-nubank",source="us-circle", target="br-nubank",    status=EdgeStatus.HEALTHY,   volume_24h=3_000_000,  capacity=10_000_000, latency_ms=600,  corridor="US-BR"),
    Edge(id="us-fed→ng-flutterwave",source="us-fed",  target="ng-flutterwave",status=EdgeStatus.HEALTHY,  volume_24h=2_400_000,  capacity=8_000_000,  latency_ms=1200, corridor="US-NG"),
    Edge(id="eu-seba→ng-flutterwave",source="eu-seba",target="ng-flutterwave",status=EdgeStatus.HEALTHY,  volume_24h=1_800_000,  capacity=6_000_000,  latency_ms=900,  corridor="EU-NG"),
    Edge(id="eu-seba→vn-momo",   source="eu-seba",    target="vn-momo",      status=EdgeStatus.HEALTHY,   volume_24h=1_500_000,  capacity=5_000_000,  latency_ms=1100, corridor="EU-VN"),
    Edge(id="eu-paysafe→eu-seba",source="eu-paysafe", target="eu-seba",      status=EdgeStatus.HEALTHY,   volume_24h=3_500_000,  capacity=8_000_000,  latency_ms=200,  corridor="EU-EU"),
    Edge(id="vn-momo→vn-tpbank", source="vn-momo",    target="vn-tpbank",    status=EdgeStatus.HEALTHY,   volume_24h=900_000,    capacity=3_000_000,  latency_ms=150,  corridor="VN-VN"),
    Edge(id="us-fed→vn-momo",    source="us-fed",     target="vn-momo",      status=EdgeStatus.HEALTHY,   volume_24h=1_200_000,  capacity=4_000_000,  latency_ms=1500, corridor="US-VN"),
    Edge(id="agent-treasury-us→us-fed",source="agent-treasury-us",target="us-fed",status=EdgeStatus.HEALTHY,volume_24h=800_000,capacity=2_000_000,latency_ms=50,corridor="US-US"),
    Edge(id="agent-settlement-eu→eu-seba",source="agent-settlement-eu",target="eu-seba",status=EdgeStatus.HEALTHY,volume_24h=600_000,capacity=1_500_000,latency_ms=50,corridor="EU-EU"),
]


def get_seed_snapshot() -> NetworkSnapshot:
    return NetworkSnapshot(ts=int(time.time()), nodes=list(NODES), edges=list(EDGES))
