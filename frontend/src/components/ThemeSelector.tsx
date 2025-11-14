import { useState, useEffect } from 'react'

export type ThemeName = 'blue' | 'purple' | 'green' | 'orange' | 'pink'

interface ThemeConfig {
  name: ThemeName
  label: string
  primary: string
  secondary: string
  accent: string
}

const THEMES: Record<ThemeName, ThemeConfig> = {
  blue: {
    name: 'blue',
    label: 'Bleu (Défaut)',
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    accent: '#0369a1',
  },
  purple: {
    name: 'purple',
    label: 'Violet',
    primary: '#a855f7',
    secondary: '#c084fc',
    accent: '#7e22ce',
  },
  green: {
    name: 'green',
    label: 'Vert',
    primary: '#22c55e',
    secondary: '#4ade80',
    accent: '#15803d',
  },
  orange: {
    name: 'orange',
    label: 'Orange',
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#c2410c',
  },
  pink: {
    name: 'pink',
    label: 'Rose',
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#be185d',
  },
}

interface ThemeSelectorProps {
  onThemeChange?: (theme: ThemeName) => void
  onBannerColorChange?: (color: string) => void
}

export const ThemeSelector = ({ onThemeChange, onBannerColorChange }: ThemeSelectorProps) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'blue'
    return (window.localStorage.getItem('appTheme') as ThemeName) || 'blue'
  })
  const [bannerColor, setBannerColor] = useState<string>(() => {
    if (typeof window === 'undefined') return THEMES.blue.primary
    return window.localStorage.getItem('bannerColor') || THEMES.blue.primary
  })

  useEffect(() => {
    const theme = THEMES[currentTheme]
    const root = document.documentElement

    // Update CSS variables
    root.style.setProperty('--primary-color', theme.primary)
    root.style.setProperty('--secondary-color', theme.secondary)
    root.style.setProperty('--accent-color', theme.accent)

    // apply banner color as well
    root.style.setProperty('--banner-color', bannerColor)

    window.localStorage.setItem('appTheme', currentTheme)
    window.localStorage.setItem('bannerColor', bannerColor)
    onThemeChange?.(currentTheme)
    onBannerColorChange?.(bannerColor)
  }, [currentTheme, bannerColor, onThemeChange, onBannerColorChange])

  return (
    <div className="theme-selector theme-section">
      <div className="theme-grid">
        {(Object.keys(THEMES) as ThemeName[]).map((themeName) => {
          const theme = THEMES[themeName]
          return (
            <button
              key={themeName}
              className={`theme-card ${currentTheme === themeName ? 'active' : ''}`}
              onClick={() => setCurrentTheme(themeName)}
              title={theme.label}
            >
              <div className="theme-preview" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }} />
              <div className="theme-info">
                <div className="theme-name">{theme.label}</div>
                <div className="theme-desc">Aperçu</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="banner-color-picker">
        <label className="banner-label">🎯 Couleur du bandeau</label>
        <div className="banner-controls">
          <input
            type="color"
            value={bannerColor}
            onChange={(e) => setBannerColor(e.target.value)}
            className="banner-color-input"
          />
          <div className="banner-sample" style={{ background: bannerColor }}>
            Aperçu du bandeau
          </div>
        </div>
      </div>
    </div>
  )
}

export const useTheme = () => {
  const [theme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'blue'
    return (window.localStorage.getItem('appTheme') as ThemeName) || 'blue'
  })

  return theme
}
