import { useEffect } from 'react'
import { useStore } from '../store'
import { useLiveGraph } from '../hooks/useLiveGraph'
import NetworkGraph from '../components/NetworkGraph'
import RiskPanel from '../components/RiskPanel'
import TimeSlider from '../components/TimeSlider'
import NodeDetail from '../components/NodeDetail'

export default function NetworkPage() {
  const { snapshot, loadInitial, selectedNode } = useStore()
  const selected = snapshot?.nodes.find(n => n.id === selectedNode) ?? null
  useLiveGraph()

  useEffect(() => { loadInitial() }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', borderBottom: '1px solid var(--color-dark-grid)', background: 'var(--surface-subtle-panel)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <div className="label">Digital Twin</div>
            <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 18, fontWeight: 400, lineHeight: 1 }}>Live Network State</div>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingLeft: 24, borderLeft: '1px solid var(--color-dark-grid)' }}>
            <Stat label="Nodes" value={snapshot?.nodes.length ?? 0} />
            <Stat label="Edges" value={snapshot?.edges.length ?? 0} />
            <Stat label="Blocked" value={snapshot?.edges.filter(e => e.status === 'blocked').length ?? 0} warn />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="http://localhost:8000/audit/report.pdf" target="_blank" className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }}>⬇ Audit PDF</a>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Graph */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, padding: 12 }}>
            {snapshot
              ? <NetworkGraph snapshot={snapshot} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-mid-gray-border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, letterSpacing: '.1em', marginBottom: 8 }}>CONNECTING</div>
                    <div className="label">Synchronising network twin…</div>
                  </div>
                </div>}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, padding: '8px 16px', borderTop: '1px solid var(--color-dark-grid)', background: 'var(--surface-subtle-panel)' }}>
            {[['var(--color-lime-interface)', 'Active'], ['#ffd166', 'Degraded'], ['#6366f1', 'Frozen'], ['#ef4444', 'Blocked']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: c as string, borderRadius: '50%' }} />
                <span className="label">{l}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 20 }}>
              {[['#334155', 'Healthy Edge'], ['#f59e0b', 'Congested'], ['#ef4444', 'Blocked Edge']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 2, background: c as string }} />
                  <span className="label">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <TimeSlider />
        </div>

        {/* Sidebar */}
        <div style={{ width: 300, borderLeft: '1px solid var(--color-dark-grid)', display: 'flex', flexDirection: 'column', background: 'rgba(6,6,6,.8)', overflow: 'hidden' }}>
          <RiskPanel />
          {selected && <NodeDetail node={selected} />}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 18, color: warn && value > 0 ? '#ef4444' : 'var(--color-lime-interface)' }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}
