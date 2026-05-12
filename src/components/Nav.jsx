import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Lead Capture' },
    { to: '/dashboard', label: 'Pipeline Dashboard' },
    { to: '/outcome', label: 'Outcome Update' },
  ]

  return (
    <nav style={{ background: '#1e293b', padding: '12px 24px', display: 'flex', gap: 24 }}>
      {links.map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{
            color: pathname === to ? '#60a5fa' : '#cbd5e1',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: pathname === to ? 'bold' : 'normal',
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
