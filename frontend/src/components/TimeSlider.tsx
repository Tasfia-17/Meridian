import { useStore } from "../store";

export default function TimeSlider() {
  const { history, simulationFrames, currentFrameIdx, setFrameIdx, setSnapshot } = useStore();

  // Use simulation frames if available, else history
  const frames = simulationFrames.length > 0 ? simulationFrames : history;
  if (frames.length < 2) return null;

  const onChange = (i: number) => {
    setFrameIdx(i);
    setSnapshot(frames[i]);
  };

  const current = frames[currentFrameIdx];
  const ts = current ? new Date(current.ts * 1000).toLocaleTimeString() : "";

  const label =
    simulationFrames.length > 0
      ? `Simulation Frame ${currentFrameIdx + 1} / ${frames.length}`
      : `History: ${ts}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/80 border-t border-slate-800">
      <span className="text-slate-400 text-xs shrink-0">⏪ Past</span>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={currentFrameIdx}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-yellow-400"
      />
      <span className="text-slate-400 text-xs shrink-0">Future ⏩</span>
      <span className="text-yellow-300 text-xs font-mono w-48 text-right shrink-0">{label}</span>
    </div>
  );
}
