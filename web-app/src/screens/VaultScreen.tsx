import type { AppSection, TokenClaims, VaultState } from '../types/ui'
import { AppLayout } from '../components/layout/AppLayout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import './screens.css'

export interface VaultScreenProps {
  /** loading = esperando GET /api/boveda-secreta; denied = 401/403. */
  state: VaultState
  username: string
  onNavigate: (section: AppSection) => void
  onLogout: () => void
  secretMessage?: string | null
  /** Claims del access_token ya decodificados. */
  claims?: TokenClaims | null
  /** El JWT tal cual, para mostrarlo (se recorta visualmente). */
  accessToken?: string | null
  error?: string | null
  onGoToLogin: () => void
}

export function VaultScreen({
  state,
  username,
  onNavigate,
  onLogout,
  secretMessage,
  claims,
  accessToken,
  error,
  onGoToLogin,
}: VaultScreenProps) {
  return (
    <AppLayout username={username} activeSection="vault" onNavigate={onNavigate} onLogout={onLogout}>
      {state === 'loading' && <VaultSkeleton />}

      {state === 'denied' && (
        <section className="card empty-state" aria-labelledby="denied-title">
          <span className="feature-icon" data-tone="danger">
            <Icon name="lock" size={28} />
          </span>
          <h1 id="denied-title">Acceso denegado</h1>
          <p>{error ?? 'Esta ruta exige un access_token con mfa_verified: true.'}</p>
          <Button icon="arrow-left" onClick={onGoToLogin}>
            Volver a iniciar sesión
          </Button>
        </section>
      )}

      {state === 'granted' && (
        <>
          <header className="vault-hero">
            <span className="feature-icon" data-tone="success">
              <Icon name="lock-open" size={28} />
            </span>
            <div className="stack-sm">
              <h1>Bóveda secreta</h1>
              <p className="muted mono">GET /api/boveda-secreta · 200 OK</p>
            </div>
            {claims?.mfa_verified && <Badge tone="success">mfa_verified: true</Badge>}
          </header>

          <div className="grid-2">
            <section className="card" aria-labelledby="secret-title">
              <h2 id="secret-title">Contenido protegido</h2>
              <div className="secret-note">{secretMessage}</div>
            </section>

            <section className="card" aria-labelledby="claims-title">
              <div className="stack-sm">
                <h2 id="claims-title">Tu access_token</h2>
                <p className="muted">Claims del JWT que emitió issue_elevated_session.</p>
              </div>
              {claims && (
                <dl className="claims-list">
                  {Object.entries(claims).map(([name, value]) => (
                    <div key={name} className="claims-row">
                      <dt>{name}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {accessToken && <code className="token-preview">{accessToken}</code>}
            </section>
          </div>
        </>
      )}
    </AppLayout>
  )
}

function VaultSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Cargando la bóveda">
      <div className="skeleton" style={{ height: 56, width: 280 }} />
      <div className="grid-2">
        <div className="skeleton" style={{ height: 220 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    </div>
  )
}
