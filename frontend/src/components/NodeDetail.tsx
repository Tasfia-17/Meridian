import { useState } from "react";
import { api } from "../lib/api";
import type { NetworkNode } from "../lib/types";
import { useStore } from "../store";

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-400",
  degraded: "bg-yellow-400",
  frozen: "bg-indigo-400",
  blocked: "bg-red-400 animate-pulse",
};

interface Props {
  node: NetworkNode;
}

export default function NodeDetail({ node }: Props) {
  const { snapshot, setHighlightPath } = useStore();
  const [routing, setRouting] = useState(false);

  const findRoute = async () => {
    if (!snapshot) return;
    setRouting(true);
    // Find a path from any US node to this node
    const from = "us-fed";
    const result = await api.route(from, node.id);
    setHighlightPath(result.path);
    setRouting(false);
  };

  return (
    <div className="p-4 border-t border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[node.compliance.status] ?? "bg-slate-400"}`} />
        <div className="text-white font-semibold text-sm truncate">{node.label}</div>
      </div>
      <div className="flex flex-col gap-1 text-xs">
        <Row label="Country" value={node.country} />
        <Row label="Type" value={node.type} />
        <Row label="Chain" value={node.chain} />
        <Row label="A-Pass Tier" value={node.compliance.tier} />
        <Row label="Status" value={<span className="capitalize">{node.compliance.status}</span>} />
        <Row label="Validator" value={node.compliance.validator_valid ? "✓ Valid" : "✗ Failed"} />
        <Row label="Liquidity" value={`$${(node.liquidity_usd / 1e6).toFixed(2)}M`} />
        <Row label="24h Volume" value={`$${(node.throughput_24h / 1e6).toFixed(2)}M`} />
      </div>
      <button
        onClick={findRoute}
        disabled={routing}
        className="mt-3 w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 text-xs rounded px-3 py-1.5 transition-colors disabled:opacity-50"
      >
        {routing ? "Finding route…" : "▶ Find Best Route Here"}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-mono">{value}</span>
    </div>
  );
}
