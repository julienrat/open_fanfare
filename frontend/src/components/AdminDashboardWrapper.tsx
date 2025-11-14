import { useState, useEffect } from 'react'
import { AdminLogin } from './AdminLogin'
import { AdminDashboardPage } from '../pages/AdminDashboard'

export const AdminDashboardWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const adminSecret = window.localStorage.getItem('adminSecret')
    if (adminSecret === 'cornichon') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('adminSecret')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return <AdminDashboardPage onLogout={handleLogout} />
}
