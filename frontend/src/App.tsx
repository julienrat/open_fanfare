import { useMemo, useState, useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { PublicEventsPage } from './pages/PublicEvents'
import { AgendaPage } from './pages/Agenda'
import { StatisticsPage } from './pages/Statistics'
import { AdminDashboardWrapper } from './components/AdminDashboardWrapper'
import { AppLogin } from './components/AppLogin'
import { getAppPassword, setAppPassword, clearAppPassword } from './api/client'

const navItems = [
  { to: '/', label: 'Présences' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/stats', label: 'Statistiques' },
  { to: '/admin', label: 'Administration' },
]

interface NavigationProps {
  onLogout: () => void
}

const Navigation = ({ onLogout }: NavigationProps) => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

  const handleNavClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="app-header">
      <div className="app-container">
        <div className="branding">
          <span className="brand-title">Open Fanfare</span>
          <span className="brand-subtitle">Gestion des présences</span>
        </div>
        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={activePath === item.to ? 'nav-link active' : 'nav-link'}
              onClick={handleNavClick}
            >
              {item.label}
            </NavLink>
          ))}
          <button onClick={onLogout} className="logout-button">
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Vérifier si un mot de passe est déjà enregistré
    const savedPassword = getAppPassword()
    if (savedPassword) {
      setIsAuthenticated(true)
    }
    setIsCheckingAuth(false)
  }, [])

  const handleLogin = async (password: string) => {
    setAppPassword(password)
    // Tester l'authentification avec une requête simple
    try {
      const response = await fetch('http://localhost:4000/api/statuses', {
        headers: {
          'x-app-password': password,
        },
      })
      if (response.ok) {
        setIsAuthenticated(true)
      } else {
        clearAppPassword()
        alert('Mot de passe incorrect')
      }
    } catch (error) {
      clearAppPassword()
      alert('Erreur de connexion')
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
      </div>
    )
  }

  const handleLogout = () => {
    clearAppPassword()
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="app">
        <AppLogin onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="app">
      <Navigation onLogout={handleLogout} />
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
