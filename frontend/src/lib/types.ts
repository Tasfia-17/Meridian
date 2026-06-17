export type NodeStatus = "active" | "frozen" | "degraded" | "blocked";
export type EdgeStatus = "healthy" | "congested" | "degraded" | "blocked";
export type NodeType = "bank" | "psp" | "exchange" | "wallet" | "agent";

export interface ComplianceState {
  tier: number;
  status: NodeStatus;
  apass_verified: boolean;
  validator_valid: boolean;
  expiration_time: number | null;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: NodeType;
  country: string;
  chain: string;
  wallet_address: string;
  compliance: ComplianceState;
  liquidity_usd: number;
  throughput_24h: number;
  x: number;
  y: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  status: EdgeStatus;
  volume_24h: number;
  capacity: number;
  latency_ms: number;
  corridor: string;
}

export interface NetworkSnapshot {
  ts: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface CorridorRisk {
  corridor: string;
  score: number;
  level: string;
  signals: string[];
  settlement_delay_min: number;
}

export interface NodeRisk {
  node_id: string;
  score: number;
  level: string;
  signals: string[];
}

export interface RiskReport {
  ts: number;
  network_health: number;
  network_level: string;
  corridor_risks: CorridorRisk[];
  node_risks: NodeRisk[];
  critical_corridors: string[];
  at_risk_node_count: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
}
