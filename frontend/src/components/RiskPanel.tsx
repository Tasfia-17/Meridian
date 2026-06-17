import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { RiskReport } from "../lib/types";

const LEVEL_STYLE: Record<string, string> = {
  LOW: "text-emerald-400",
  ELEVATED: "text-yellow-400",
  HIGH: "text-orange-400",
  CRITICAL: "text-red-400 animate-pulse",
};

export default function RiskPanel() {
  const [report, setReport] = useState<RiskReport | null>(null);

  useEffect(() => {
    const load = () => api.risk().then(setReport).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  if (!report) return <div className="text-slate-400 p-4 text-sm">Loading risk data…</div>;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      {/* Network health */}
      <div>
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Network Health</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${report.network_health * 100}%`,
                background: report.network_health > 0.7 ? "#00d4aa" : report.network_health > 0.4 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <span className={`font-mono font-bold ${LEVEL_STYLE[report.network_level] ?? "text-white"}`}>
            {(report.network_health * 100).toFixed(0)}%
          </span>
        </div>
        <div className={`text-xs mt-1 ${LEVEL_STYLE[report.network_level]}`}>{report.network_level}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Critical Corridors" value={report.critical_corridors.length} warn={report.critical_corridors.length > 0} />
        <Stat label="At-Risk Nodes" value={report.at_risk_node_count} warn={report.at_risk_node_count > 0} />
      </div>

      {/* Top corridor risks */}
      <div>
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Corridor Risk</div>
        <div className="flex flex-col gap-1">
          {report.corridor_risks.slice(0, 6).map((r) => (
            <div key={r.corridor} className="flex items-center gap-2">
              <span className="text-slate-300 font-mono w-14 shrink-0">{r.corridor}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${r.score * 100}%`, background: r.score > 0.6 ? "#ef4444" : r.score > 0.3 ? "#f59e0b" : "#00d4aa" }}
                />
              </div>
              <span className={`text-xs font-mono w-8 text-right ${LEVEL_STYLE[r.level] ?? "text-white"}`}>
                {(r.score * 100).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical signals */}
      {report.corridor_risks.filter((r) => r.level === "CRITICAL" || r.level === "HIGH").length > 0 && (
        <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-3">
          <div className="text-red-400 text-xs font-bold uppercase mb-1">⚠ Active Alerts</div>
          {report.corridor_risks
            .filter((r) => r.signals.length > 0 && r.score > 0.4)
            .slice(0, 4)
            .map((r) =>
              r.signals.slice(0, 1).map((s, i) => (
                <div key={`${r.corridor}-${i}`} className="text-red-300 text-xs">
                  {r.corridor}: {s}
                </div>
              ))
            )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className={`text-xl font-bold font-mono mt-0.5 ${warn && value > 0 ? "text-red-400" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
