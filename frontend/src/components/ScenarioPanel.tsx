import { useState } from "react";
import { api } from "../lib/api";
import type { Scenario } from "../lib/types";
import { useStore } from "../store";

interface Props {
  scenarios: Scenario[];
  onResult: () => void;
}

export default function ScenarioPanel({ scenarios, onResult }: Props) {
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setSimulationFrames, setSnapshot } = useStore();

  const run = async (id: string) => {
    setRunning(id);
    setError(null);
    try {
      const result = await api.runScenario(id);
      if (result.frames.length > 0) {
        setSimulationFrames(result.frames);
        setSnapshot(result.frames[result.frames.length - 1]);
      }
      onResult();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  };

  const reset = async () => {
    await api.reset();
    const snap = await api.snapshot();
    setSnapshot(snap);
    setSimulationFrames([]);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-slate-400 text-xs uppercase tracking-wider">Incident Injection</div>
      {scenarios.map((s) => (
        <button
          key={s.id}
          onClick={() => run(s.id)}
          disabled={!!running}
          title={s.description}
          className="text-left bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg px-3 py-2.5 transition-colors group"
        >
          <div className="text-white text-sm font-medium group-hover:text-yellow-300 transition-colors">
            {running === s.id ? "⏳ " : "▶ "}
            {s.name}
          </div>
          <div className="text-slate-400 text-xs mt-0.5">{s.description}</div>
        </button>
      ))}

      {error && <div className="text-red-400 text-xs p-2 bg-red-950/30 rounded">{error}</div>}

      <button
        onClick={reset}
        className="mt-2 text-slate-400 hover:text-white text-xs border border-slate-700 hover:border-slate-500 rounded px-3 py-1.5 transition-colors"
      >
        ↺ Reset Network
      </button>
    </div>
  );
}
