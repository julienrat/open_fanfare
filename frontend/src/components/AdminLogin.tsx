import { useState } from 'react'
import type { FormEvent } from 'react'

const ADMIN_PASSWORD = 'cornichon'

interface AdminLoginProps {
  onLoginSuccess: () => void
}

export const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (password === ADMIN_PASSWORD) {
      // Sauvegarder le mot de passe dans localStorage
      window.localStorage.setItem('adminSecret', password)
      setError(false)
      onLoginSuccess()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Administration</h1>
          <p>Veuillez vous identifier pour accéder à l'interface d'administration</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="login-error">
              ❌ Mot de passe incorrect. Veuillez réessayer.
            </div>
          )}

          <button type="submit" className="primary-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
