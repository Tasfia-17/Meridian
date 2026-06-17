import { useEffect } from 'react'
import { useStore } from '../store'
import GridCanvas from '../components/GridCanvas'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span className="label">{label}</span>
      <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: 'var(--color-silver-whisper)' }}>{value}</span>
    </div>
  )
}

export default function AgentsPage() {
  const { snapshot, loadInitial } = useStore()
  useEffect(() => { loadInitial() }, [])

  const agents = snapshot?.nodes.filter(n => n.type === 'agent') ?? []
  const allNodes = snapshot?.nodes ?? []

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
      <div className="scanline" />

      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 8 }}>AI Agent Monitor</div>
        <h1 style={{ fontFamily: 'var(--font-pt-serif)', fontSize: 48, fontWeight: 400, lineHeight: 1 }}>
          Every agent is a<br /><span className="lime">first-class actor.</span>
        </h1>
        <p className="faint" style={{ fontSize: 14, marginTop: 12, maxWidth: 580, lineHeight: 1.65 }}>
          Treasury agents, settlement agents, and market-making agents are tracked as verified participants.
          Meridian predicts agent-caused congestion, compliance failures, and cascade risk before execution.
        </p>
      </div>

      {/* Agent cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--color-dark-grid)', marginBottom: 32 }}>
        {agents.length > 0 ? agents.map(agent => (
          <div key={agent.id} className="card fade-up" style={{ position: 'relative', overflow: 'hidden', minHeight: 220 }}>
            <GridCanvas density={15} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, border: '1.5px solid var(--color-lime-interface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🤖</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.label}</div>
                  <div className="label">{agent.country} · {agent.chain}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label="A-Pass Tier" value={agent.compliance.tier} />
                <Row label="Status" value={
                  <span style={{ textTransform: 'capitalize', color: agent.compliance.status === 'active' ? 'var(--color-lime-interface)' : '#ffd166' }}>
                    {agent.compliance.status}
                  </span>} />
                <Row label="Liquidity" value={`$${(agent.liquidity_usd / 1e6).toFixed(2)}M`} />
                <Row label="24h Volume" value={`$${(agent.throughput_24h / 1e6).toFixed(2)}M`} />
                <Row label="Validator" value={agent.compliance.validator_valid ? '✓ Valid' : '✗ Failed'} />
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: 'span 3', padding: 40, textAlign: 'center', background: 'var(--surface-dark-card)' }}>
            <div className="label">No agent nodes in current network state</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Risk scenarios */}
        <div>
          <div className="label" style={{ marginBottom: 16 }}>Agent Risk Scenarios</div>
          {[
            { title: 'Simultaneous Execution', risk: 'HIGH', desc: '50 treasury agents transacting simultaneously saturate corridor capacity. Use Agent Flood scenario to simulate.' },
            { title: 'Compliance Failure', risk: 'ELEVATED', desc: 'A-Pass tier drops below corridor min_tier after rule change. All agent-initiated flows fail validator check.' },
            { title: 'Settlement Flood', risk: 'CRITICAL', desc: 'Market-making agents sweep simultaneously. Liquidity concentration drives adjacent corridors into BLOCKED.' },
          ].map(({ title, risk, desc }) => (
            <div key={title} className="card-trace" style={{ padding: 20, background: 'var(--surface-dark-card)', marginBottom: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-silver-whisper)' }}>{title}</span>
                <span className={`badge ${risk === 'CRITICAL' ? 'badge-critical' : risk === 'HIGH' ? 'badge-blocked' : 'badge-degraded'}`} style={{ fontSize: 9 }}>{risk}</span>
              </div>
              <div style={{ color: 'var(--color-mid-gray-border)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* All participants table */}
        <div>
          <div className="label" style={{ marginBottom: 16 }}>All Participants</div>
          <div style={{ border: '1px solid var(--color-dark-grid)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px 80px', padding: '8px 14px', background: 'var(--surface-elevated-accent)', borderBottom: '1px solid var(--color-dark-grid)' }}>
              {['Node', 'Type', 'Tier', 'Status'].map(h => <div key={h} className="label">{h}</div>)}
            </div>
            {allNodes.map(n => (
              <div key={n.id} className="cascade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 60px 50px 80px', padding: '10px 14px', borderBottom: '1px solid var(--color-dark-grid)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{n.label}</div>
                  <div className="label">{n.country}</div>
                </div>
                <div className="label" style={{ textTransform: 'capitalize' }}>{n.type}</div>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: n.compliance.tier >= 60 ? 'var(--color-lime-interface)' : '#ffd166' }}>{n.compliance.tier}</div>
                <span className={`badge ${n.compliance.status === 'active' ? 'badge-active' : n.compliance.status === 'blocked' ? 'badge-blocked' : 'badge-degraded'}`} style={{ fontSize: 9 }}>
                  {n.compliance.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
