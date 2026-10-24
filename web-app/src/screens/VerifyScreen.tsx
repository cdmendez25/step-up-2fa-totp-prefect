import type { FormEvent } from 'react'
import type { FlowRunState, PipelineTask, SecondFactor, TotpWindow } from '../types/ui'
import { AuthLayout } from '../components/layout/AuthLayout'
import { PipelinePanel } from '../components/pipeline/PipelinePanel'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
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
          <div className="session-timer">
            <span className="session-timer-label">
              <Icon name="clock" size={18} />
              Tu sesión temporal expira en
            </span>
            <time>{preAuthTimeLeft}</time>
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
            <TextField
              id="verify-code"
              label="Código de 6 dígitos"
              variant="otp"
              value={code}
              onValueChange={onCodeChange}
              error={codeError}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
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
