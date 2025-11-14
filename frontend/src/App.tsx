import { useMemo } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { PublicEventsPage } from './pages/PublicEvents'
import { AgendaPage } from './pages/Agenda'
import { StatisticsPage } from './pages/Statistics'
import { AdminDashboardWrapper } from './components/AdminDashboardWrapper'

const navItems = [
  { to: '/', label: 'Présences' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/stats', label: 'Statistiques' },
  { to: '/admin', label: 'Administration' },
]

const Navigation = () => {
  const location = useLocation()

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/admin')) {
      return '/admin'
    }
    if (location.pathname.startsWith('/stats')) {
      return '/stats'
    }
    if (location.pathname.startsWith('/agenda')) {
      return '/agenda'
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
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/stats" element={<StatisticsPage />} />
          <Route path="/admin" element={<AdminDashboardWrapper />} />
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
