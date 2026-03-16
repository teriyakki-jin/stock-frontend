import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { logout } from '../api/auth'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, logout: clearAuth } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      navigate('/auth')
    }
  }

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`font-mono text-xs uppercase tracking-widest transition-colors duration-200 px-3 py-1 rounded-sm ${
          active
            ? 'text-terminal-green border border-terminal-green/30 bg-terminal-green/5'
            : 'text-terminal-dim hover:text-terminal-text'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="border-b border-terminal-border bg-terminal-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-5 h-5 border border-terminal-green rotate-45 flex items-center justify-center">
            <div className="w-2 h-2 bg-terminal-green rotate-[-45deg]" />
          </div>
          <span className="font-mono text-sm font-bold text-terminal-green text-glow-green tracking-widest">
            NEXUS
          </span>
        </Link>

        {/* Nav links */}
        {isAuthenticated && (
          <nav className="flex items-center gap-1">
            {navLink('/dashboard', 'OVERVIEW')}
            {navLink('/trade', 'TRADE')}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            <span className="font-mono text-xs text-terminal-muted">LIVE</span>
          </div>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="font-mono text-xs text-terminal-muted hover:text-terminal-red transition-colors uppercase tracking-widest"
            >
              LOGOUT
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
