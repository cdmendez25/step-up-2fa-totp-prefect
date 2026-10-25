import type { FormEvent, ReactNode } from 'react'
import type { AppSection, BackupCode, MfaStatus } from '../types/ui'
import { AppLayout } from '../components/layout/AppLayout'
import { BackupCodesCard } from '../components/mfa/BackupCodesCard'
import { MfaStateMachine } from '../components/mfa/MfaStateMachine'
import { QrCard } from '../components/mfa/QrCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { TextField } from '../components/ui/TextField'
import './screens.css'

export interface SetupMfaScreenProps {
  username: string
  onNavigate: (section: AppSection) => void
  onLogout: () => void

  /** Estado de la máquina de aprovisionamiento: decide qué se muestra. */
  status: MfaStatus

  // NONE → PENDING_VERIFICATION
  onStart: () => void
  isStarting?: boolean
  startError?: string | null

  // PENDING_VERIFICATION: QR + confirmación del primer código
  qrCode: ReactNode | null
  secret: string | null
  issuer: string
  accountName: string
  onCopySecret: () => void
  confirmCode: string
  onConfirmCodeChange: (code: string) => void
  onConfirmSubmit: (event: FormEvent<HTMLFormElement>) => void
  isConfirming?: boolean
  confirmError?: string | null

  // ACTIVE: códigos de respaldo
  backupCodes: BackupCode[]
  onCopyBackupCodes: () => void
  onDownloadBackupCodes: () => void
  onGoToVault: () => void
}

export function SetupMfaScreen(props: SetupMfaScreenProps) {
  const { username, onNavigate, onLogout, status } = props

  return (
    <AppLayout username={username} activeSection="security" onNavigate={onNavigate} onLogout={onLogout}>
      <header className="page-header">
        <div>
          <h1>Verificación en dos pasos</h1>
          <p>Protege tu cuenta con un código que cambia cada 30 segundos y que solo tu teléfono puede calcular.</p>
        </div>
        <MfaStateMachine status={status} />
      </header>

      {status === 'NONE' && <StartSection {...props} />}
      {status === 'PENDING_VERIFICATION' && <PendingSection {...props} />}
      {status === 'ACTIVE' && <ActiveSection {...props} />}
    </AppLayout>
  )
}

function StartSection({ onStart, isStarting = false, startError }: SetupMfaScreenProps) {
  return (
    <section className="card start-card" aria-labelledby="start-title">
      <span className="feature-icon">
        <Icon name="smartphone" size={28} />
      </span>
      <div className="stack-sm">
        <h2 id="start-title">El 2FA está desactivado</h2>
        <p className="muted">Al activarlo, tu cuenta queda en PENDING_VERIFICATION hasta que confirmes el primer código.</p>
      </div>

      <ol className="how-list">
        <li>
          <strong>Generamos un secreto</strong>
          <span>Te lo mostramos como QR y como texto en Base32.</span>
        </li>
        <li>
          <strong>Lo guardas en tu app</strong>
          <span>Tu iPhone calcula los códigos, incluso en modo avión.</span>
        </li>
        <li>
          <strong>Confirmas un código</strong>
          <span>Solo entonces el estado pasa a ACTIVE.</span>
        </li>
      </ol>

      {startError && <Alert variant="error">{startError}</Alert>}

      <div>
        <Button icon="shield-check" loading={isStarting} onClick={onStart}>
          Activar 2FA
        </Button>
      </div>
    </section>
  )
}

function PendingSection({
  qrCode,
  secret,
  issuer,
  accountName,
  onCopySecret,
  confirmCode,
  onConfirmCodeChange,
  onConfirmSubmit,
  isConfirming = false,
  confirmError,
}: SetupMfaScreenProps) {
  return (
    <>
      <Alert variant="warning" title="Pendiente de verificación">
        El 2FA todavía no se exige al iniciar sesión. Así no quedas bloqueado si generas el QR pero nunca lo escaneas.
      </Alert>

      <div className="grid-2">
        <QrCard
          qrCode={qrCode}
          secret={secret}
          issuer={issuer}
          accountName={accountName}
          onCopySecret={onCopySecret}
        />

        <section className="card" aria-labelledby="confirm-title">
          <div className="stack-sm">
            <span className="step-label">Paso 2</span>
            <h2 id="confirm-title">Confirma con tu primer código</h2>
            <p className="muted">Escribe el código que muestra tu app para comprobar que ambos relojes están sincronizados.</p>
          </div>

          {confirmError && <Alert variant="error">{confirmError}</Alert>}

          <form className="stack" onSubmit={onConfirmSubmit} noValidate>
            <TextField
              id="confirm-code"
              label="Código de 6 dígitos"
              variant="otp"
              value={confirmCode}
              onValueChange={onConfirmCodeChange}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
            />
            <Button type="submit" block icon="check" loading={isConfirming}>
              Confirmar y activar
            </Button>
          </form>
        </section>
      </div>
    </>
  )
}

function ActiveSection({ backupCodes, onCopyBackupCodes, onDownloadBackupCodes, onGoToVault }: SetupMfaScreenProps) {
  return (
    <>
      <Alert variant="success" title="2FA activo">
        A partir de ahora, cada inicio de sesión necesitará el código de tu app o un código de respaldo.
      </Alert>

      {backupCodes.length > 0 ? (
        <BackupCodesCard codes={backupCodes} onCopy={onCopyBackupCodes} onDownload={onDownloadBackupCodes} />
      ) : (
        <p className="muted">Tus códigos de respaldo se mostraron una sola vez, al activar el 2FA.</p>
      )}

      <div>
        <Button icon="lock-open" onClick={onGoToVault}>
          Ir a la bóveda
        </Button>
      </div>
    </>
  )
}
