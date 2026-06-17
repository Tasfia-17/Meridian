import { useEffect, useRef } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import type { NetworkSnapshot } from "../lib/types";
import { useStore } from "../store";

const STATUS_COLOR: Record<string, string> = {
  active: "#00d4aa",
  degraded: "#f59e0b",
  frozen: "#6366f1",
  blocked: "#ef4444",
};

const EDGE_COLOR: Record<string, string> = {
  healthy: "#334155",
  congested: "#f59e0b",
  degraded: "#f97316",
  blocked: "#ef4444",
};

const NODE_TYPE_SIZE: Record<string, number> = {
  bank: 22,
  psp: 18,
  exchange: 16,
  wallet: 12,
  agent: 10,
};

interface Props {
  snapshot: NetworkSnapshot;
}

export default function NetworkGraph({ snapshot }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const { highlightPath, setSelectedNode, selectedNode } = useStore();

  // Initialize sigma once
  useEffect(() => {
    if (!containerRef.current) return;
    const g = new Graph({ multi: false, type: "directed" });
    graphRef.current = g;

    const renderer = new Sigma(g, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeType: "arrow",
      labelFont: "Inter, sans-serif",
      labelSize: 11,
    });

    renderer.on("clickNode", ({ node }) => {
      setSelectedNode(node === selectedNode ? null : node);
    });

    sigmaRef.current = renderer;
    return () => {
      renderer.kill();
      sigmaRef.current = null;
    };
  }, []);

  // Update graph data when snapshot changes
  useEffect(() => {
    const g = graphRef.current;
    if (!g) return;

    // Sync nodes
    const incomingNodes = new Set(snapshot.nodes.map((n) => n.id));
    g.nodes().filter((id) => !incomingNodes.has(id)).forEach((id) => g.dropNode(id));

    for (const node of snapshot.nodes) {
      const highlighted = highlightPath?.includes(node.id);
      const attrs = {
        x: node.x,
        y: -node.y, // flip Y for canvas
        size: NODE_TYPE_SIZE[node.type] ?? 14,
        color: highlighted ? "#ffffff" : STATUS_COLOR[node.compliance.status] ?? "#94a3b8",
        label: node.label,
        borderColor: highlighted ? "#facc15" : undefined,
      };
      if (g.hasNode(node.id)) g.mergeNodeAttributes(node.id, attrs);
      else g.addNode(node.id, attrs);
    }

    // Sync edges
    const incomingEdges = new Set(snapshot.edges.map((e) => e.id));
    g.edges().filter((id) => !incomingEdges.has(id)).forEach((id) => g.dropEdge(id));

    for (const edge of snapshot.edges) {
      const onPath = highlightPath
        ? highlightPath.includes(edge.source) && highlightPath.includes(edge.target)
        : false;
      const attrs = {
        color: onPath ? "#facc15" : EDGE_COLOR[edge.status] ?? "#334155",
        size: onPath ? 3 : edge.status === "blocked" ? 1 : 1.5,
        type: "arrow",
      };
      if (g.hasEdge(edge.id)) {
        g.mergeEdgeAttributes(edge.id, attrs);
      } else {
        try {
          g.addEdgeWithKey(edge.id, edge.source, edge.target, attrs);
        } catch (_) {}
      }
    }

    sigmaRef.current?.refresh();
  }, [snapshot, highlightPath]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#0f172a", borderRadius: 12 }}
    />
  );
}
