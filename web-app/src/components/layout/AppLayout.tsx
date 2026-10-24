import type { ReactNode } from 'react'
import type { AppSection } from '../../types/ui'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import './layout.css'

const sections: Array<{ id: AppSection; label: string }> = [
  { id: 'vault', label: 'Bóveda' },
  { id: 'security', label: 'Seguridad' },
]

interface AppLayoutProps {
  username: string
  activeSection: AppSection
  onNavigate: (section: AppSection) => void
  onLogout: () => void
  children: ReactNode
}

export function AppLayout({ username, activeSection, onNavigate, onLogout, children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            <span className="brand-mark">
              <Icon name="shield-check" />
            </span>
            <span className="brand-name">Bóveda 2FA</span>
          </span>

          <nav className="topnav" aria-label="Principal">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className="topnav-item"
                aria-current={section.id === activeSection ? 'page' : undefined}
                onClick={() => onNavigate(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>

          <div className="topbar-end">
            <span className="topbar-user mono">{username}</span>
            <Button variant="ghost" size="sm" icon="log-out" onClick={onLogout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="page">
        {children}
      </main>
    </div>
  )
}
