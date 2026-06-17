import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Overview' },
  { to: '/network', label: 'Network' },
  { to: '/simulate', label: 'Simulate' },
  { to: '/corridors', label: 'Corridors' },
  { to: '/agents', label: 'Agents' },
  { to: '/audit', label: 'Audit' },
]

export default function Nav() {
  const { pathname } = useLocation()
  return (
    <nav style={{
      background: 'var(--surface-subtle-panel)',
      borderBottom: '1px solid var(--color-dark-grid)',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 52, position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* M hexagon logo */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="#c5ff4a" strokeWidth="1.5" />
          <polygon points="14,6 22,10.5 22,19.5 14,24 6,19.5 6,10.5" fill="rgba(197,255,74,0.08)" stroke="#c5ff4a" strokeWidth=".5" />
          <text x="14" y="19" textAnchor="middle" fill="#c5ff4a" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, fontWeight: 600 }}>M</text>
        </svg>
        <div>
          <span style={{ color: 'var(--color-lime-interface)', fontFamily: 'var(--font-jetbrains)', fontSize: 13, fontWeight: 600, letterSpacing: '.1em' }}>MERIDIAN</span>
          <span style={{ color: 'var(--color-faint-grid)', fontFamily: 'var(--font-jetbrains)', fontSize: 9, letterSpacing: '.08em', display: 'block', marginTop: -2 }}>TREASURY INTELLIGENCE</span>
        </div>
      </Link>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {links.map(({ to, label }) => (
          <Link key={to} to={to} style={{
            textDecoration: 'none',
            fontFamily: 'var(--font-inter-tight)', fontSize: 13, fontWeight: 400,
            color: pathname === to ? 'var(--color-silver-whisper)' : 'var(--color-mid-gray-border)',
            borderBottom: pathname === to ? '1.5px solid var(--color-lime-interface)' : '1.5px solid transparent',
            paddingBottom: 2, transition: 'color .2s',
          }}>{label}</Link>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16, borderLeft: '1px solid var(--color-dark-grid)' }}>
          <div className="dot dot-green pulse" />
          <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: 'var(--color-lime-interface)', letterSpacing: '.06em' }}>LIVE</span>
        </div>
        <Link to="/network" className="btn-lime" style={{ padding: '8px 16px', fontSize: 12 }}>Launch Twin →</Link>
      </div>
    </nav>
  )
}
