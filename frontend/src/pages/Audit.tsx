import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { api } from '../lib/api'
import type { RiskReport } from '../lib/types'

const LEVEL_COLOR: Record<string, string> = {
  LOW: 'var(--color-lime-interface)',
  ELEVATED: '#ffd166',
  HIGH: '#ff8c00',
  CRITICAL: '#ff4444',
}

export default function AuditPage() {
  const { snapshot, loadInitial } = useStore()
  const [report, setReport] = useState<RiskReport | null>(null)

  useEffect(() => {
    loadInitial()
    api.risk().then(setReport)
  }, [])

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Compliance Reporting</div>
          <h1 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 48, fontWeight: 400, lineHeight: 1 }}>
            Audit <span className="lime">intelligence.</span>
          </h1>
          <p className="faint" style={{ fontSize: 14, marginTop: 12, maxWidth: 520, lineHeight: 1.65 }}>
            Chain-of-evidence operational report. Every corridor risk, node compliance state, and network health metric — audit-ready in one click.
          </p>
        </div>
        <a href="http://localhost:8000/audit/report.pdf" target="_blank" className="btn-lime pulse" style={{ flexShrink: 0 }}>
          ⬇ Download PDF Report →
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Main report preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Network summary */}
          {report && (
            <div className="card fade-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Network Health Score</div>
                  <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 52, fontWeight: 400, color: LEVEL_COLOR[report.network_level] ?? '#fff', lineHeight: 1 }}>
                    {(report.network_health * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${report.network_level === 'LOW' ? 'badge-active' : report.network_level === 'ELEVATED' ? 'badge-degraded' : 'badge-blocked'}`}>
                    {report.network_level}
                  </span>
                  <div className="label" style={{ marginTop: 8 }}>
                    {report.critical_corridors.length} critical corridor{report.critical_corridors.length !== 1 ? 's' : ''}
                  </div>
                  <div className="label">{report.at_risk_node_count} at-risk nodes</div>
                </div>
              </div>
              <div className="progress-bar" style={{ height: 3 }}>
                <div className="progress-fill" style={{ width: `${report.network_health * 100}%`, background: LEVEL_COLOR[report.network_level] }} />
              </div>
            </div>
          )}

          {/* Corridor risk table */}
          {report && (
            <div className="card fade-up">
              <div className="label" style={{ marginBottom: 16 }}>Corridor Risk Assessment</div>
              <div style={{ border: '1px solid var(--color-dark-grid)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 90px 80px', padding: '8px 14px', background: 'var(--surface-elevated-accent)', borderBottom: '1px solid var(--color-dark-grid)' }}>
                  {['Corridor', 'Top Signal', 'Score', 'Level', 'Delay'].map(h => <div key={h} className="label">{h}</div>)}
                </div>
                {report.corridor_risks.map(r => (
                  <div key={r.corridor} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 90px 80px', padding: '12px 14px', borderBottom: '1px solid var(--color-dark-grid)', alignItems: 'center', transition: 'background .15s' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>{r.corridor}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-mid-gray-border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.signals[0] ?? '—'}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: LEVEL_COLOR[r.level] }}>{(r.score * 100).toFixed(0)}</span>
                    <span className={`badge ${r.level === 'LOW' ? 'badge-active' : r.level === 'ELEVATED' ? 'badge-degraded' : r.level === 'HIGH' ? 'badge-blocked' : 'badge-critical'}`} style={{ fontSize: 9 }}>{r.level}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: r.settlement_delay_min > 0 ? '#ffd166' : 'var(--color-mid-gray-border)' }}>
                      {r.settlement_delay_min > 0 ? `${r.settlement_delay_min}+ min` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Node compliance table */}
          {snapshot && (
            <div className="card fade-up">
              <div className="label" style={{ marginBottom: 16 }}>Network Node Snapshot</div>
              <div style={{ border: '1px solid var(--color-dark-grid)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px 100px 80px', padding: '8px 14px', background: 'var(--surface-elevated-accent)', borderBottom: '1px solid var(--color-dark-grid)' }}>
                  {['Node', 'Country', 'Type', 'Tier', 'Liquidity', 'Status'].map(h => <div key={h} className="label">{h}</div>)}
                </div>
                {snapshot.nodes.map(n => (
                  <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px 100px 80px', padding: '10px 14px', borderBottom: '1px solid var(--color-dark-grid)', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{n.label}</div>
                    <div className="label">{n.country}</div>
                    <div className="label" style={{ textTransform: 'capitalize' }}>{n.type}</div>
                    <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: n.compliance.tier >= 60 ? 'var(--color-lime-interface)' : '#ffd166' }}>{n.compliance.tier}</div>
                    <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12 }}>${(n.liquidity_usd / 1e6).toFixed(1)}M</div>
                    <span className={`badge ${n.compliance.status === 'active' ? 'badge-active' : n.compliance.status === 'blocked' ? 'badge-blocked' : 'badge-degraded'}`} style={{ fontSize: 9 }}>
                      {n.compliance.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card fade-up">
            <div className="label" style={{ marginBottom: 16 }}>Report Contents</div>
            {[
              'Network health score',
              'Corridor risk assessment',
              'Node compliance states',
              'Active alert signals',
              'Settlement delay forecast',
              'Cleanverse integration status',
              'Timestamp & chain reference',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 6 ? '1px solid var(--color-dark-grid)' : 'none' }}>
                <span style={{ color: 'var(--color-lime-interface)', fontSize: 10 }}>✓</span>
                <span style={{ fontSize: 13 }}>{item}</span>
              </div>
            ))}
            <a href="http://localhost:8000/audit/report.pdf" target="_blank" className="btn-lime" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
              Generate PDF →
            </a>
          </div>

          {/* Travel Rule */}
          <div className="card fade-up">
            <div className="label" style={{ marginBottom: 12 }}>Travel Rule Export</div>
            <p style={{ color: 'var(--color-mid-gray-border)', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
              Download Travel Rule compliance reports for specific A-Token transactions via the Cleanverse API.
            </p>
            <div style={{ padding: '10px 14px', background: 'var(--surface-subtle-panel)', border: '1px solid var(--color-dark-grid)', fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: 'var(--color-mid-gray-border)', lineHeight: 1.8 }}>
              POST /cleanverse/download_travel_rule<br />
              <span style={{ color: 'var(--color-lime-interface)' }}>→ returns signed PDF URL</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
