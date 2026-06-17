import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { CorridorRisk } from '../lib/types'
import { api } from '../lib/api'

const LEVEL_COLOR: Record<string, string> = {
  LOW: 'var(--color-lime-interface)',
  ELEVATED: '#ffd166',
  HIGH: '#ff8c00',
  CRITICAL: '#ff4444',
}

function CorridorBar({ risk, max = 1 }: { risk: CorridorRisk; max?: number }) {
  const w = (risk.score / max) * 100
  const c = LEVEL_COLOR[risk.level] ?? '#fff'
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-dark-grid)', transition: 'background .2s' }}
      onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: 'var(--color-silver-whisper)', width: 60, flexShrink: 0 }}>{risk.corridor}</span>
        <div style={{ flex: 1, height: 4, background: 'var(--color-dark-grid)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${w}%`, background: c, transition: 'width .8s ease' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: c, width: 40, textAlign: 'right', flexShrink: 0 }}>{(risk.score * 100).toFixed(0)}</span>
        <span className={`badge badge-${risk.level.toLowerCase() === 'critical' ? 'critical' : risk.level.toLowerCase() === 'high' ? 'blocked' : risk.level.toLowerCase() === 'elevated' ? 'degraded' : 'low'}`} style={{ fontSize: 9, flexShrink: 0 }}>{risk.level}</span>
      </div>
      {risk.signals.length > 0 && (
        <div style={{ paddingLeft: 72, display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {risk.signals.map((s, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--color-mid-gray-border)', padding: '2px 8px', border: '1px solid var(--color-dark-grid)', background: 'var(--surface-subtle-panel)' }}>{s}</span>
          ))}
        </div>
      )}
      {risk.settlement_delay_min > 0 && (
        <div style={{ paddingLeft: 72, marginTop: 6 }}>
          <span className="label">Est. delay: </span>
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#ffd166' }}>{risk.settlement_delay_min}+ min</span>
        </div>
      )}
    </div>
  )
}

export default function CorridorsPage() {
  const { snapshot, loadInitial } = useStore()
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    loadInitial()
    api.risk().then(setReport)
    const t = setInterval(() => api.risk().then(setReport), 5000)
    return () => clearInterval(t)
  }, [])

  const corridors = snapshot ? [...new Set(snapshot.edges.map(e => e.corridor))] : []

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 8 }}>Corridor Intelligence</div>
        <h1 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 48, fontWeight: 400, lineHeight: 1 }}>
          Payment <span className="lime">corridors.</span>
        </h1>
        <p className="faint" style={{ fontSize: 14, marginTop: 12, maxWidth: 560, lineHeight: 1.65 }}>
          Live risk assessment across all active payment corridors. Updated every 5 seconds from the network twin.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Corridor risk list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: 'var(--surface-dark-card)', borderBottom: '1px solid var(--color-dark-grid)' }}>
            <div className="label">Corridor</div>
            <div style={{ display: 'flex', gap: 40 }}>
              <div className="label">Risk Score</div>
              <div className="label">Level</div>
            </div>
          </div>
          {report?.corridor_risks?.map((r: CorridorRisk) => <CorridorBar key={r.corridor} risk={r} />) ?? (
            corridors.map(c => (
              <div key={c} style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-dark-grid)' }}>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{c}</div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="label" style={{ marginBottom: 16 }}>Network Health</div>
            {report && (
              <>
                <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 48, fontWeight: 400, color: 'var(--color-lime-interface)', lineHeight: 1, marginBottom: 4 }}>
                  {(report.network_health * 100).toFixed(0)}%
                </div>
                <div className="label" style={{ color: LEVEL_COLOR[report.network_level] ?? '#fff' }}>{report.network_level}</div>
                <div style={{ marginTop: 16 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${report.network_health * 100}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="label" style={{ marginBottom: 16 }}>Critical Alerts</div>
            {report?.critical_corridors?.length > 0
              ? report.critical_corridors.map((c: string) => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
                    <div className="dot dot-red pulse" />
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{c}</span>
                    <span className="badge badge-critical" style={{ fontSize: 9, marginLeft: 'auto' }}>CRITICAL</span>
                  </div>
                ))
              : <div className="label" style={{ color: 'var(--color-lime-interface)' }}>✓ No critical corridors</div>}
          </div>

          {/* Edge table */}
          <div className="card">
            <div className="label" style={{ marginBottom: 14 }}>Corridor Edges</div>
            {snapshot?.edges.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
                <div className={`dot dot-${e.status === 'blocked' ? 'red' : e.status === 'degraded' ? 'yellow' : e.status === 'congested' ? 'orange' : 'green'}`} />
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--color-mid-gray-border)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.corridor}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--color-faint-grid)' }}>${(e.volume_24h / 1e6).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
