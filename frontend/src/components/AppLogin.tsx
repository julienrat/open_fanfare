import { useState } from 'react'
import type { FormEvent } from 'react'
import './AppLogin.css'

interface AppLoginProps {
  onLogin: (password: string) => void
}

export const AppLogin = ({ onLogin }: AppLoginProps) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password.trim()) {
      onLogin(password)
    } else {
      setError(true)
    }
  }

  return (
    <div className="app-login-container">
      <div className="app-login-card">
        <div className="app-login-header">
          <h1 className="app-login-title">🎺 Open Fanfare</h1>
          <p className="app-login-subtitle">Accès sécurisé</p>
        </div>
        <form onSubmit={handleSubmit} className="app-login-form">
          <label className="form-field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              placeholder="Entrez le mot de passe"
              autoFocus
            />
          </label>
          {error && <p className="error-message">Mot de passe requis</p>}
          <button type="submit" className="primary-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
