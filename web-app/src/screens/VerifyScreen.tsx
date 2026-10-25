import type { FormEvent } from 'react'
import type { FlowRunState, PipelineTask, SecondFactor, TotpWindow } from '../types/ui'
import { AuthLayout } from '../components/layout/AuthLayout'
import { PipelinePanel } from '../components/pipeline/PipelinePanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { OtpField } from '../components/ui/OtpField'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { TextField } from '../components/ui/TextField'
import './screens.css'

export interface VerifyScreenProps {
  factor: SecondFactor
  onFactorChange: (factor: SecondFactor) => void
  code: string
  onCodeChange: (code: string) => void
  backupCode: string
  onBackupCodeChange: (code: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting?: boolean
  error?: string | null
  codeError?: string
  /** Tiempo restante del pre_auth_token ya formateado, p. ej. "04:32". */
  preAuthTimeLeft?: string | null
  /** Fracción de tiempo que le queda al token (1 = recién emitido, 0 = vencido). */
  preAuthProgress?: number
  /** true en el último minuto: la barra se pone en alerta. */
  preAuthWarning?: boolean
  /** "success" pinta las casillas de verde; "error" las hace temblar. */
  codeStatus?: 'idle' | 'error' | 'success'
  pipeline: PipelineTask[]
  runState: FlowRunState
  matchedWindow?: TotpWindow | null
  flowRunId?: string | null
  prefectUrl?: string
  onBackToLogin: () => void
}

export function VerifyScreen({
  factor,
  onFactorChange,
  code,
  onCodeChange,
  backupCode,
  onBackupCodeChange,
  onSubmit,
  isSubmitting = false,
  error,
  codeError,
  preAuthTimeLeft,
  preAuthProgress = 1,
  preAuthWarning = false,
  codeStatus = 'idle',
  pipeline,
  runState,
  matchedWindow,
  flowRunId,
  prefectUrl,
  onBackToLogin,
}: VerifyScreenProps) {
  return (
    <AuthLayout currentStep={2}>
      <div className="auth-card">
        <Button variant="ghost" size="sm" icon="arrow-left" className="back-button" onClick={onBackToLogin}>
          Volver
        </Button>

        <header className="auth-header">
          <span className="step-label">Paso 2 de 2</span>
          <h1>Verificación en dos pasos</h1>
          <p>
            {factor === 'totp'
              ? 'Abre tu app Authenticator e ingresa el código de 6 dígitos que ves ahora.'
              : 'Ingresa uno de tus códigos de respaldo. Cada uno funciona una sola vez.'}
          </p>
        </header>

        {preAuthTimeLeft && (
          <div className="session-timer" data-warning={preAuthWarning || undefined}>
            <span className="session-timer-label">
              <Icon name="clock" size={18} />
              Tu sesión temporal expira en
            </span>
            <time>{preAuthTimeLeft}</time>
            <span className="session-timer-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${Math.max(0, Math.min(1, preAuthProgress))})` }} />
            </span>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <form className="stack" onSubmit={onSubmit} noValidate>
          <SegmentedControl<SecondFactor>
            name="factor"
            legend="Tipo de segundo factor"
            value={factor}
            onChange={onFactorChange}
            options={[
              { value: 'totp', label: 'App Authenticator', icon: 'smartphone' },
              { value: 'backup', label: 'Código de respaldo', icon: 'key' },
            ]}
          />

          {factor === 'totp' ? (
            <OtpField
              id="verify-code"
              label="Código de 6 dígitos"
              value={code}
              onValueChange={onCodeChange}
              error={codeError}
              status={codeStatus}
              autoFocus
            />
          ) : (
            <TextField
              id="verify-backup"
              label="Código de respaldo"
              variant="backup"
              value={backupCode}
              onValueChange={onBackupCodeChange}
              error={codeError}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="XXXX-XXXX"
              required
            />
          )}

          <Button type="submit" block icon="shield-check" loading={isSubmitting}>
            Verificar
          </Button>
        </form>
      </div>

      <PipelinePanel
        tasks={pipeline}
        runState={runState}
        showTotpWindows={factor === 'totp'}
        matchedWindow={matchedWindow}
        flowRunId={flowRunId}
        prefectUrl={prefectUrl}
      />
    </AuthLayout>
  )
}
