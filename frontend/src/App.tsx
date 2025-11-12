import { useMemo } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { PublicEventsPage } from './pages/PublicEvents'
import { AdminDashboardPage } from './pages/AdminDashboard'

const navItems = [
  { to: '/', label: 'Présences' },
  { to: '/admin', label: 'Administration' },
]

const Navigation = () => {
  const location = useLocation()

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin'
    }
    return '/'
  }, [location.pathname])

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="branding">
          <span className="brand-title">Open Fanfare</span>
          <span className="brand-subtitle">Gestion des présences</span>
        </div>
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={activePath === item.to ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

function App() {
  return (
    <div className="app">
      <Navigation />
      <main className="app-main app-container">
        <Routes>
          <Route path="/" element={<PublicEventsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="app-container">
          <small>© {new Date().getFullYear()} Open Fanfare</small>
        </div>
      </footer>
    </div>
  )
}

export default App
