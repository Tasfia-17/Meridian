import type { NetworkSnapshot, RiskReport, Scenario } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WS_BASE = BASE.replace(/^http/, "ws");

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export const api = {
  snapshot: () => get<NetworkSnapshot>("/graph/snapshot"),
  risk: () => get<RiskReport>("/graph/risk"),
  scenarios: () => get<Scenario[]>("/simulation/scenarios"),
  runScenario: (id: string) => post<{ frames: NetworkSnapshot[] }>("/simulation/run", { scenario_id: id }),
  route: (from: string, to: string) => post<{ path: string[] | null; viable: boolean }>("/simulation/route", { from_node: from, to_node: to }),
  reset: () => post<void>("/simulation/reset", {}),
  wsUrl: () => `${WS_BASE}/ws`,
};
