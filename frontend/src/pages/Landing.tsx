import { Link } from "react-router-dom"
import { useEffect, useState } from 'react'
import GridCanvas from '../components/GridCanvas'

const stats = [
  { value: '10', suffix: '+', label: 'Network Nodes' },
  { value: '5', suffix: '', label: 'Live Corridors' },
  { value: '$147M', suffix: '', label: 'Volume Modelled' },
  { value: '<3s', suffix: '', label: 'Prediction Latency' },
]

const pillars = [
  { tag: 'A-PASS', title: 'Verified Identity Layer', body: 'Every network participant anchored to a Cleanverse A-Pass. Tier, jurisdiction, and expiry signals feed the live compliance state engine in real time.', icon: '◈' },
  { tag: 'A-TOKEN', title: 'Asset Intelligence Layer', body: 'aUSDC flow aggregation across 5 global corridors. Liquidity positions, settlement velocity, and corridor capacity tracked at the transaction level.', icon: '◆' },
  { tag: 'VALIDATOR', title: 'Compliance Signal Layer', body: 'CCP Protocol evaluations, Travel Rule outcomes, and screening results power the cascade model. Identifies bottlenecks before funds move.', icon: '◉' },
  { tag: 'SIMULATION', title: 'Network Simulation Engine', body: 'Eisenberg-Noe cascade model with 5 pre-built incident scenarios. What-if analysis for Sunrise blocks, liquidity drains, sanctions hits, rule changes, and AI agent floods.', icon: '⬡' },
  { tag: 'PREDICTION', title: 'Risk Forecasting Layer', body: 'Rule-based scoring across CCP timeout rates, corridor throughput, and compliance event frequency. Honest signals, no black-box ML.', icon: '◎' },
  { tag: 'AUDIT', title: 'Compliance Reporting', body: 'One-click audit-ready PDF reports with corridor risk tables, node compliance states, and network health scores. Full chain-of-evidence documentation.', icon: '▣' },
]

const ticker = ['A-PASS IDENTITY', '·', 'A-TOKEN FLOWS', '·', 'CCP PROTOCOL', '·', 'CORRIDOR INTELLIGENCE', '·', 'SETTLEMENT PREDICTION', '·', 'COMPLIANCE TWIN', '·', 'CLEANVERSE STACK', '·']

const TERMINAL_LINES = [
  '> meridian.simulate --scenario sunrise_block',
  '  loading network state... 10 nodes, 11 edges',
  '  injecting incident: US→Nigeria Sunrise block',
  '  running E-N cascade model...',
  '  ⚠ US-NG corridor: CRITICAL (score=0.80)',
  '  ⚠ EU-NG corridor: CRITICAL (score=0.80)',
  '  → recommend route: us-circle → eu-seba → vn-momo',
  '  generating audit report...',
  '  ✓ report: meridian_audit_20260617.pdf',
]

function Terminal() {
  const [lines, setLines] = useState<string[]>([])
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    if (cursor >= TERMINAL_LINES.length) {
      const t = setTimeout(() => { setLines([]); setCursor(0) }, 4000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setLines(l => [...l, TERMINAL_LINES[cursor]])
      setCursor(c => c + 1)
    }, cursor === 0 ? 500 : [300, 400, 700, 900, 600, 600, 800, 500][cursor - 1] ?? 500)
    return () => clearTimeout(t)
  }, [cursor])

  return (
    <div style={{ background: '#000', border: '1px solid var(--color-dark-grid)', padding: '16px 20px', fontFamily: 'var(--font-jetbrains)', fontSize: 11, lineHeight: 1.9, minHeight: 200 }}>
      <div style={{ color: 'var(--color-faint-grid)', marginBottom: 8, fontSize: 10, letterSpacing: '.1em' }}>
        MERIDIAN NEXUS v0.1.0 · CLEANVERSE UAT
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{
          color: l.includes('✓') ? 'var(--color-lime-interface)' : l.includes('⚠') ? '#ffd166' : l.includes('→') ? '#94d4ff' : l.startsWith('>') ? '#fff' : 'var(--color-mid-gray-border)',
          animation: 'cascade-in .2s ease forwards',
        }}>{l}</div>
      ))}
      {cursor < TERMINAL_LINES.length && <span style={{ color: 'var(--color-lime-interface)', animation: 'blink 1s step-end infinite' }}>█</span>}
    </div>
  )
}

// Animated corridor flow SVG
function CorridorFlow() {
  return (
    <svg viewBox="0 0 600 200" style={{ width: '100%', height: 200, display: 'block' }}>
      {/* Nodes */}
      {[
        { x: 60, y: 100, label: 'US', status: 'ok' },
        { x: 190, y: 50, label: 'EU', status: 'ok' },
        { x: 320, y: 100, label: 'BR', status: 'ok' },
        { x: 440, y: 60, label: 'NG', status: 'warn' },
        { x: 540, y: 130, label: 'VN', status: 'ok' },
      ].map(({ x, y, label, status }) => (
        <g key={label}>
          {status === 'warn' && <circle cx={x} cy={y} r="18" fill="none" stroke="#ffd166" strokeWidth=".5" opacity=".4"><animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" /></circle>}
          <circle cx={x} cy={y} r="12" fill="var(--surface-dark-card)" stroke={status === 'warn' ? '#ffd166' : 'var(--color-lime-interface)'} strokeWidth="1.5" />
          <text x={x} y={y + 4} textAnchor="middle" fill={status === 'warn' ? '#ffd166' : 'var(--color-lime-interface)'} style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 9, fontWeight: 600 }}>{label}</text>
        </g>
      ))}
      {/* Edges */}
      {[
        { x1: 72, y1: 100, x2: 178, y2: 50, ok: true },
        { x1: 202, y1: 50, x2: 308, y2: 100, ok: true },
        { x1: 72, y1: 100, x2: 428, y2: 62, ok: false },
        { x1: 202, y1: 50, x2: 428, y2: 62, ok: false },
        { x1: 202, y1: 50, x2: 528, y2: 130, ok: true },
      ].map(({ x1, y1, x2, y2, ok }, i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={ok ? 'var(--color-lime-interface)' : '#ff6b6b'} strokeWidth={ok ? 1 : 1.5}
          strokeDasharray={ok ? '4 4' : '3 3'} opacity={ok ? .5 : .8}>
          <animate attributeName="stroke-dashoffset" values="20;0" dur={`${1.5 + i * .3}s`} repeatCount="indefinite" />
        </line>
      ))}
      {/* Blocked label */}
      <text x="285" y="95" fill="#ff6b6b" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 8, letterSpacing: '.05em' }}>BLOCKED</text>
    </svg>
  )
}

export default function Landing() {
  const [networkHealth] = useState(82)
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <div className="scanline" />

      {/* Hero */}
      <section style={{ padding: '80px 0 60px', borderBottom: '1px solid var(--color-dark-grid)', position: 'relative', overflow: 'hidden', minHeight: 540 }}>
        <GridCanvas density={60} />
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <span className="label">Built on Cleanverse · A-Pass · A-Token · CCP Protocol</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 68, fontWeight: 400, lineHeight: .95, letterSpacing: '-.02em', marginBottom: 24 }}>
              Weather<br />forecasting<br />for <span className="lime glitch">money.</span>
            </h1>
            <p style={{ color: 'var(--color-white-outlined-text)', fontSize: 15, lineHeight: 1.7, maxWidth: 420, marginBottom: 32 }}>
              A live digital twin of stablecoin payment networks. Meridian ingests verified identity, compliant asset flows, and compliance signals to predict settlement failures before they occur.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
              <Link to="/network" className="btn-lime pulse">Open Live Twin →</Link>
              <Link to="/simulate" className="btn-ghost">Run Simulation</Link>
            </div>
            {/* Health bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="label">Network Health</div>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${networkHealth}%` }} />
              </div>
              <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 13, color: 'var(--color-lime-interface)' }}>{networkHealth}%</span>
            </div>
          </div>
          <div>
            <Terminal />
            <div style={{ marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 10 }}>Live Network — US · EU · BR · NG · VN</div>
              <CorridorFlow />
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, letterSpacing: '.12em', color: t === '·' ? 'var(--color-faint-grid)' : 'var(--color-mid-gray-border)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--color-dark-grid)' }}>
        {stats.map(({ value, suffix, label }, i) => (
          <div key={i} className="fade-up" style={{ padding: '28px 22px', borderRight: i < 3 ? '1px solid var(--color-dark-grid)' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 44, fontWeight: 400, color: 'var(--color-lime-interface)', lineHeight: 1 }}>
              {value}<span style={{ fontSize: 24 }}>{suffix}</span>
            </div>
            <div className="label" style={{ marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </section>

      {/* Comparison table */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid var(--color-dark-grid)' }}>
        <div className="label" style={{ marginBottom: 20 }}>Meridian vs. Reactive Monitoring</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--color-dark-grid)' }}>
          {[
            { metric: 'Settlement visibility', us: 'Pre-transaction', them: 'Post-failure' },
            { metric: 'Compliance signal', us: 'Real-time CCP', them: 'Manual review' },
            { metric: 'Cascade detection', us: 'E-N model', them: 'Not offered' },
            { metric: 'Route recommendation', us: 'Automated', them: 'Manual override' },
            { metric: 'Identity layer', us: 'A-Pass verified', them: 'Self-reported' },
            { metric: 'Audit trail', us: 'PDF + on-chain', them: 'Logs only' },
          ].map(({ metric, us, them }, i) => (
            <div key={i} className="card-trace fade-up" style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'center', background: 'var(--surface-dark-card)' }}>
              <span style={{ color: 'var(--color-mid-gray-border)', fontSize: 12 }}>{metric}</span>
              <span style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 11 }}>{us}</span>
              <span style={{ color: 'var(--color-faint-grid)', fontFamily: 'var(--font-jetbrains)', fontSize: 11, textDecoration: 'line-through' }}>{them}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section style={{ padding: '40px 0 60px' }}>
        <div className="label" style={{ marginBottom: 28 }}>Five-Layer Architecture</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--color-dark-grid)' }}>
          {pillars.map(({ tag, title, body, icon }, i) => (
            <div key={i} className="card card-trace fade-up" style={{ position: 'relative' }}>
              <div style={{ fontSize: 28, color: 'var(--color-lime-interface)', marginBottom: 12, lineHeight: 1 }}>{icon}</div>
              <div className="label" style={{ color: 'var(--color-lime-interface)', marginBottom: 10 }}>{tag}</div>
              <div style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 20, fontWeight: 400, lineHeight: 1.2, marginBottom: 12 }}>{title}</div>
              <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 13, lineHeight: 1.65 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--color-dark-grid)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <GridCanvas density={30} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="label" style={{ marginBottom: 20 }}>Ready to see inside your network?</div>
          <h2 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 52, fontWeight: 400, marginBottom: 32 }}>
            Open the <span className="lime">live twin.</span>
          </h2>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/network" className="btn-lime pulse">Launch Network Twin →</Link>
            <Link to="/simulate" className="btn-ghost">Inject Incident</Link>
            <a href="http://localhost:8000/audit/report.pdf" target="_blank" className="btn-ghost">⬇ Sample Audit PDF</a>
          </div>
        </div>
      </section>
    </main>
  )
}
