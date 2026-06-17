import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { api } from '../lib/api'
import type { NetworkSnapshot } from '../lib/types'

const SCENARIO_META: Record<string, { icon: string; color: string; desc_long: string }> = {
  sunrise_block:   { icon: '🌅', color: '#ff6b6b', desc_long: 'Simulates a jurisdiction enforcement action that blocks the US→Nigeria corridor via Sunrise Protocol.' },
  liquidity_drain: { icon: '💧', color: '#ffd166', desc_long: 'Brazil corridor loses 80% of available liquidity — stress propagates to downstream counterparties.' },
  sanctions_hit:   { icon: '⚠', color: '#ff8c00', desc_long: 'EU gateway receives a live sanctions designation. Asset flows freeze immediately; cascade to EU-NG edges.' },
  rule_change:     { icon: '📋', color: '#94d4ff', desc_long: 'Platform min_tier raised to 60 globally. Lower-tier nodes enter DEGRADED state across all corridors.' },
  agent_flood:     { icon: '🤖', color: '#c084fc', desc_long: '50 AI treasury agents transact simultaneously. Congestion cascades from agent edges into core corridors.' },
}

function FrameDiff({ prev, curr }: { prev: NetworkSnapshot; curr: NetworkSnapshot }) {
  const changes = curr.edges.filter(e => {
    const p = prev.edges.find(x => x.id === e.id)
    return p && p.status !== e.status
  })
  const nodeChanges = curr.nodes.filter(n => {
    const p = prev.nodes.find(x => x.id === n.id)
    return p && p.compliance.status !== n.compliance.status
  })
  return (
    <div style={{ padding: '12px 16px' }}>
      {nodeChanges.map(n => (
        <div key={n.id} className="cascade-in" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--color-mid-gray-border)', width: 120, flexShrink: 0 }}>{n.label.slice(0, 16)}</span>
          <span className="badge badge-blocked" style={{ fontSize: 9 }}>{n.compliance.status.toUpperCase()}</span>
        </div>
      ))}
      {changes.map(e => (
        <div key={e.id} className="cascade-in" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--color-mid-gray-border)', width: 180, flexShrink: 0 }}>{e.id}</span>
          <span className={`badge ${e.status === 'blocked' ? 'badge-blocked' : e.status === 'degraded' ? 'badge-degraded' : 'badge-active'}`} style={{ fontSize: 9 }}>
            {e.status.toUpperCase()}
          </span>
        </div>
      ))}
      {changes.length === 0 && nodeChanges.length === 0 && <div className="label" style={{ padding: '8px 0' }}>No state changes in this frame</div>}
    </div>
  )
}

export default function SimulatePage() {
  const { scenarios, loadInitial, snapshot, setSimulationFrames, setSnapshot, simulationFrames, currentFrameIdx, setFrameIdx } = useStore()
  const [running, setRunning] = useState<string | null>(null)
  const [result, setResult] = useState<{ frames: NetworkSnapshot[]; scenarioId: string } | null>(null)
  const [routeResult, setRouteResult] = useState<{ path: string[] | null; viable: boolean } | null>(null)
  const [routeFrom, setRouteFrom] = useState('us-fed')
  const [routeTo, setRouteTo] = useState('ng-flutterwave')

  useEffect(() => { loadInitial() }, [])

  const run = async (id: string) => {
    setRunning(id); setResult(null); setRouteResult(null)
    const res = await api.runScenario(id)
    setSimulationFrames(res.frames)
    setSnapshot(res.frames[res.frames.length - 1])
    setResult({ frames: res.frames, scenarioId: id })
    setRunning(null)
  }

  const reset = async () => {
    await api.reset()
    const snap = await api.snapshot()
    setSnapshot(snap); setSimulationFrames([]); setResult(null); setRouteResult(null)
  }

  const findRoute = async () => {
    const r = await api.route(routeFrom, routeTo)
    setRouteResult(r)
  }

  const frame = simulationFrames[currentFrameIdx]
  const prevFrame = simulationFrames[Math.max(0, currentFrameIdx - 1)]

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
      <div className="scanline" />

      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 8 }}>Simulation Engine</div>
        <h1 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 48, fontWeight: 400, lineHeight: 1 }}>
          Inject an <span className="lime">incident.</span>
        </h1>
        <p className="faint" style={{ fontSize: 14, marginTop: 12, maxWidth: 600, lineHeight: 1.65 }}>
          Choose a scenario to simulate against the live network state. Watch the Eisenberg-Noe cascade propagate, then generate a route recommendation or audit report.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Scenarios */}
        <div>
          <div className="label" style={{ marginBottom: 16 }}>Available Scenarios</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--color-dark-grid)' }}>
            {scenarios.map(s => {
              const meta = SCENARIO_META[s.id] ?? { icon: '◆', color: 'var(--color-lime-interface)', desc_long: s.description }
              const isActive = result?.scenarioId === s.id
              return (
                <button key={s.id} onClick={() => run(s.id)} disabled={!!running}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px', background: isActive ? 'rgba(197,255,74,0.05)' : 'var(--surface-dark-card)', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .2s', borderLeft: isActive ? `2px solid var(--color-lime-interface)` : '2px solid transparent' }}>
                  <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-silver-whisper)', fontFamily: 'var(--font-inter-tight)', fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                      {running === s.id && <span className="badge badge-pending" style={{ fontSize: 9 }}>RUNNING…</span>}
                      {isActive && <span className="badge badge-active" style={{ fontSize: 9 }}>ACTIVE</span>}
                    </div>
                    <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 12, lineHeight: 1.55 }}>{meta.desc_long}</div>
                  </div>
                  <div style={{ color: meta.color, fontFamily: 'var(--font-jetbrains)', fontSize: 11, flexShrink: 0 }}>▶ RUN</div>
                </button>
              )
            })}
          </div>
          <button onClick={reset} style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--color-dark-grid)', color: 'var(--color-mid-gray-border)', padding: '10px 18px', cursor: 'pointer', fontFamily: 'var(--font-inter-tight)', fontSize: 13, width: '100%', transition: 'border-color .2s' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--color-mid-gray-border)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--color-dark-grid)')}>
            ↺ Reset Network to Seed State
          </button>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result && (
            <div className="card fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div className="label">Simulation Result</div>
                <span className="badge badge-blocked">{result.scenarioId.replace('_', ' ').toUpperCase()}</span>
              </div>

              {/* Frame scrubber */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="label">Cascade Frames</div>
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--color-lime-interface)' }}>
                    {currentFrameIdx + 1} / {result.frames.length}
                  </span>
                </div>
                <input type="range" min={0} max={result.frames.length - 1} value={currentFrameIdx}
                  onChange={e => { setFrameIdx(Number(e.target.value)); setSnapshot(result.frames[Number(e.target.value)]) }}
                  style={{ width: '100%', accentColor: 'var(--color-lime-interface)' }} />
              </div>

              {/* Changes in this frame */}
              <div className="label" style={{ marginBottom: 8 }}>State Changes — Frame {currentFrameIdx + 1}</div>
              <div style={{ background: 'var(--surface-subtle-panel)', border: '1px solid var(--color-dark-grid)', minHeight: 100 }}>
                {frame && prevFrame && <FrameDiff prev={prevFrame} curr={frame} />}
              </div>
            </div>
          )}

          {/* Route finder */}
          <div className="card">
            <div className="label" style={{ marginBottom: 14 }}>Route Recommendation</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>From Node</div>
                <select value={routeFrom} onChange={e => setRouteFrom(e.target.value)}>
                  {snapshot?.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>To Node</div>
                <select value={routeTo} onChange={e => setRouteTo(e.target.value)}>
                  {snapshot?.nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={findRoute} className="btn-lime" style={{ width: '100%', justifyContent: 'center' }}>
              Find Best Compliant Route →
            </button>
            {routeResult && (
              <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-subtle-panel)', border: `1px solid ${routeResult.viable ? 'var(--color-glow-green)' : '#7a2020'}` }}>
                {routeResult.viable
                  ? <><div className="label" style={{ color: 'var(--color-lime-interface)', marginBottom: 8 }}>✓ ROUTE FOUND</div>
                     <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: 'var(--color-lime-interface)', lineHeight: 1.8 }}>
                       {routeResult.path?.join(' → ')}
                     </div></>
                  : <div className="label" style={{ color: '#ff6b6b' }}>✗ NO VIABLE ROUTE — ALL PATHS BLOCKED</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
