import type { ReactNode } from 'react'
import type { AuthStep } from '../../types/ui'
import { Icon } from '../ui/Icon'
import './layout.css'

const steps: Array<{ step: AuthStep; title: string; endpoint: string }> = [
  { step: 1, title: 'Credenciales', endpoint: 'POST /auth/login → pre_auth_token' },
  { step: 2, title: 'Segundo factor', endpoint: 'POST /auth/verify-2fa → flow de Prefect' },
  { step: 3, title: 'Acceso elevado', endpoint: 'access_token · mfa_verified: true' },
]

interface AuthLayoutProps {
  /** Paso del flujo Step-Up que se resalta en el panel lateral. */
  currentStep?: AuthStep
  children: ReactNode
}

export function AuthLayout({ currentStep, children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <aside className="brand-panel" aria-label="Cómo funciona el acceso">
        <span className="brand">
          <span className="brand-mark">
            <Icon name="shield-check" />
          </span>
          Bóveda 2FA
        </span>

        <div className="brand-copy">
          <p className="eyebrow">Step-Up Authentication</p>
          <h2>Tu contraseña abre la puerta. Tu teléfono abre la bóveda.</h2>
          <ol className="flow-steps">
            {steps.map(({ step, title, endpoint }) => (
              <li key={step} aria-current={step === currentStep ? 'step' : undefined}>
                <span className="flow-num">{step}</span>
                <div>
                  <strong>{title}</strong>
                  <span className="mono">{endpoint}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="brand-foot">TOTP RFC 6238 implementado desde cero · Observabilidad con Prefect</p>
      </aside>

      <main id="main" className="auth-main">
        {children}
      </main>
    </div>
  )
}
