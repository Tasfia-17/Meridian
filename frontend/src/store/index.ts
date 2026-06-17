import { create } from "zustand";
import type { NetworkSnapshot, RiskReport, Scenario } from "../lib/types";
import { api } from "../lib/api";

interface AppState {
  snapshot: NetworkSnapshot | null;
  history: NetworkSnapshot[];
  risk: RiskReport | null;
  scenarios: Scenario[];
  simulationFrames: NetworkSnapshot[];
  currentFrameIdx: number;
  highlightPath: string[] | null;
  selectedNode: string | null;

  setSnapshot: (s: NetworkSnapshot) => void;
  pushHistory: (s: NetworkSnapshot) => void;
  setRisk: (r: RiskReport) => void;
  setScenarios: (ss: Scenario[]) => void;
  setSimulationFrames: (frames: NetworkSnapshot[]) => void;
  setFrameIdx: (i: number) => void;
  setHighlightPath: (p: string[] | null) => void;
  setSelectedNode: (id: string | null) => void;

  loadInitial: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  snapshot: null,
  history: [],
  risk: null,
  scenarios: [],
  simulationFrames: [],
  currentFrameIdx: 0,
  highlightPath: null,
  selectedNode: null,

  setSnapshot: (s) => set({ snapshot: s }),
  pushHistory: (s) => set((st) => ({ history: [...st.history.slice(-200), s] })),
  setRisk: (r) => set({ risk: r }),
  setScenarios: (ss) => set({ scenarios: ss }),
  setSimulationFrames: (frames) => set({ simulationFrames: frames, currentFrameIdx: 0 }),
  setFrameIdx: (i) => set({ currentFrameIdx: i }),
  setHighlightPath: (p) => set({ highlightPath: p }),
  setSelectedNode: (id) => set({ selectedNode: id }),

  loadInitial: async () => {
    const [snap, risk, scenarios] = await Promise.all([api.snapshot(), api.risk(), api.scenarios()]);
    set({ snapshot: snap, risk, scenarios });
    get().pushHistory(snap);
  },
}));
