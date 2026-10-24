// ⚠️ GALERÍA DE DISEÑO TEMPORAL — NO ES LA APP REAL.
// Muestra cada pantalla con datos falsos para revisar el diseño.
// Se elimina en cuanto conectes tu lógica (ver README.md de esta carpeta).
import { useState, type ReactNode } from 'react'
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { SetupMfaScreen } from '../screens/SetupMfaScreen'
import { VaultScreen } from '../screens/VaultScreen'
import { VerifyScreen } from '../screens/VerifyScreen'
import {
  noop,
  pipelineBackup,
  pipelineIdle,
  pipelineReplay,
  pipelineRunning,
  pipelineSuccess,
  sampleBackupCodes,
  sampleClaims,
  sampleSecret,
  sampleSecretMessage,
  sampleToken,
} from './mocks'
import './design-preview.css'

const emptyLogin = { username: '', password: '' }
const filledLogin = { username: 'carlos', password: 'contraseña-segura' }
const emptyRegister = { username: '', email: '', password: '', confirmPassword: '' }

const fakeQr = (
  <svg viewBox="0 0 29 29" shapeRendering="crispEdges" aria-label="QR de ejemplo">
    <rect width="29" height="29" fill="#fff" />
    <path
      fill="#0f172a"
      d="M2 2h7v7H2zM3 3v5h5V3zM4 4h3v3H4zM20 2h7v7h-7zM21 3v5h5V3zM22 4h3v3h-3zM2 20h7v7H2zM3 21v5h5v-5zM4 22h3v3H4zM11 2h1v2h1v1h-2zM14 3h2v1h-1v2h-1zM12 6h2v2h-1v1h-1zM16 6h1v3h-1zM10 10h2v1h1v1h-3zM14 10h3v1h-1v2h-2zM18 10h2v2h-1v1h-1zM21 11h3v1h-2v1h-1zM25 10h2v3h-1v-2h-1zM2 11h2v1h1v1H2zM6 12h2v2H7v-1H6zM11 13h2v2h-2zM15 14h3v1h-1v2h-2zM20 14h2v1h1v2h-3zM24 14h3v2h-2v1h-1zM3 15h3v1h1v1H3zM8 16h2v2H9v1H8zM12 17h2v1h1v2h-3zM18 18h1v2h-2v-1h1zM21 19h2v1h2v1h-4zM26 18h1v4h-1zM11 21h2v2h-2zM15 22h3v1h-2v2h-1zM19 22h2v2h-2zM23 23h2v1h2v3h-1v-2h-3zM11 24h1v3h-1zM13 25h2v2h-2zM18 25h4v1h-1v1h-3z"
    />
  </svg>
)

const screens: Record<string, { label: string; variants: Record<string, { label: string; render: () => ReactNode }> }> = {
  login: {
    label: 'Login',
    variants: {
      default: {
        label: 'Vacío',
        render: () => <LoginScreen values={emptyLogin} onChange={noop} onSubmit={noop} onGoToRegister={noop} />,
      },
      error: {
        label: 'Error de credenciales',
        render: () => (
          <LoginScreen
            values={filledLogin}
            onChange={noop}
            onSubmit={noop}
            onGoToRegister={noop}
            error="Usuario o contraseña incorrectos."
          />
        ),
      },
      fields: {
        label: 'Errores por campo',
        render: () => (
          <LoginScreen
            values={emptyLogin}
            onChange={noop}
            onSubmit={noop}
            onGoToRegister={noop}
            fieldErrors={{ username: 'Escribe tu usuario o correo.', password: 'Escribe tu contraseña.' }}
          />
        ),
      },
      loading: {
        label: 'Enviando',
        render: () => (
          <LoginScreen values={filledLogin} onChange={noop} onSubmit={noop} onGoToRegister={noop} isSubmitting />
        ),
      },
    },
  },
  register: {
    label: 'Registro',
    variants: {
      default: {
        label: 'Vacío',
        render: () => <RegisterScreen values={emptyRegister} onChange={noop} onSubmit={noop} onGoToLogin={noop} />,
      },
      errors: {
        label: 'Errores por campo',
        render: () => (
          <RegisterScreen
            values={{ username: 'carlos', email: 'carlos@', password: '123', confirmPassword: '1234' }}
            onChange={noop}
            onSubmit={noop}
            onGoToLogin={noop}
            fieldErrors={{
              email: 'El correo no es válido.',
              password: 'Debe tener al menos 8 caracteres.',
              confirmPassword: 'Las contraseñas no coinciden.',
            }}
          />
        ),
      },
      success: {
        label: 'Cuenta creada',
        render: () => (
          <RegisterScreen
            values={emptyRegister}
            onChange={noop}
            onSubmit={noop}
            onGoToLogin={noop}
            success="Ya puedes iniciar sesión con tu usuario y contraseña."
          />
        ),
      },
    },
  },
  verify: {
    label: 'Verificar 2FA',
    variants: {
      idle: {
        label: 'Esperando código',
        render: () => (
          <VerifyScreen
            factor="totp"
            onFactorChange={noop}
            code=""
            onCodeChange={noop}
            backupCode=""
            onBackupCodeChange={noop}
            onSubmit={noop}
            onBackToLogin={noop}
            preAuthTimeLeft="04:32"
            pipeline={pipelineIdle}
            runState="idle"
          />
        ),
      },
      running: {
        label: 'Flow ejecutándose',
        render: () => (
          <VerifyScreen
            factor="totp"
            onFactorChange={noop}
            code="482913"
            onCodeChange={noop}
            backupCode=""
            onBackupCodeChange={noop}
            onSubmit={noop}
            onBackToLogin={noop}
            isSubmitting
            preAuthTimeLeft="04:10"
            pipeline={pipelineRunning}
            runState="running"
            flowRunId="glowing-falcon"
          />
        ),
      },
      success: {
        label: 'Éxito (ventana C-1)',
        render: () => (
          <VerifyScreen
            factor="totp"
            onFactorChange={noop}
            code="482913"
            onCodeChange={noop}
            backupCode=""
            onBackupCodeChange={noop}
            onSubmit={noop}
            onBackToLogin={noop}
            preAuthTimeLeft="04:08"
            pipeline={pipelineSuccess}
            runState="completed"
            matchedWindow={-1}
            flowRunId="glowing-falcon"
          />
        ),
      },
      replay: {
        label: 'Replay Attack',
        render: () => (
          <VerifyScreen
            factor="totp"
            onFactorChange={noop}
            code="482913"
            onCodeChange={noop}
            backupCode=""
            onBackupCodeChange={noop}
            onSubmit={noop}
            onBackToLogin={noop}
            error="Este código ya fue usado. Espera al siguiente código de tu app."
            preAuthTimeLeft="03:51"
            pipeline={pipelineReplay}
            runState="failed"
            flowRunId="crimson-otter"
          />
        ),
      },
      backup: {
        label: 'Código de respaldo',
        render: () => (
          <VerifyScreen
            factor="backup"
            onFactorChange={noop}
            code=""
            onCodeChange={noop}
            backupCode="C3HV-2LQS"
            onBackupCodeChange={noop}
            onSubmit={noop}
            onBackToLogin={noop}
            preAuthTimeLeft="03:20"
            pipeline={pipelineBackup}
            runState="completed"
            flowRunId="quiet-heron"
          />
        ),
      },
    },
  },
  setup: {
    label: 'Configurar 2FA',
    variants: {
      none: { label: 'NONE', render: () => <SetupPreview status="NONE" /> },
      pending: { label: 'PENDING_VERIFICATION', render: () => <SetupPreview status="PENDING_VERIFICATION" /> },
      pendingError: {
        label: 'PENDING + código inválido',
        render: () => (
          <SetupPreview status="PENDING_VERIFICATION" confirmError="Ese código no es válido. Revisa que la hora de tu iPhone sea automática." />
        ),
      },
      active: { label: 'ACTIVE', render: () => <SetupPreview status="ACTIVE" /> },
    },
  },
  vault: {
    label: 'Bóveda',
    variants: {
      granted: {
        label: 'Acceso concedido',
        render: () => (
          <VaultScreen
            state="granted"
            username="carlos"
            onNavigate={noop}
            onLogout={noop}
            secretMessage={sampleSecretMessage}
            claims={sampleClaims}
            accessToken={sampleToken}
            onGoToLogin={noop}
          />
        ),
      },
      loading: {
        label: 'Cargando',
        render: () => (
          <VaultScreen state="loading" username="carlos" onNavigate={noop} onLogout={noop} onGoToLogin={noop} />
        ),
      },
      denied: {
        label: 'Acceso denegado',
        render: () => (
          <VaultScreen
            state="denied"
            username="carlos"
            onNavigate={noop}
            onLogout={noop}
            error="403 · Tu token no tiene mfa_verified: true. Verifica tu segundo factor."
            onGoToLogin={noop}
          />
        ),
      },
    },
  },
}

function SetupPreview({ status, confirmError }: { status: 'NONE' | 'PENDING_VERIFICATION' | 'ACTIVE'; confirmError?: string }) {
  return (
    <SetupMfaScreen
      username="carlos"
      onNavigate={noop}
      onLogout={noop}
      status={status}
      onStart={noop}
      qrCode={fakeQr}
      secret={sampleSecret}
      issuer="Bóveda 2FA"
      accountName="carlos"
      onCopySecret={noop}
      confirmCode=""
      onConfirmCodeChange={noop}
      onConfirmSubmit={noop}
      confirmError={confirmError}
      backupCodes={sampleBackupCodes}
      onCopyBackupCodes={noop}
      onDownloadBackupCodes={noop}
      onGoToVault={noop}
    />
  )
}

// La selección vive en el hash (#verify/replay) para poder compartir un estado concreto.
function readHash(): [string, string] {
  const [screen = 'login', variant = ''] = window.location.hash.slice(1).split('/')
  const safeScreen = screen in screens ? screen : 'login'
  const variants = screens[safeScreen].variants
  return [safeScreen, variant in variants ? variant : Object.keys(variants)[0]]
}

export function DesignPreview() {
  const [[screen, variant], setSelection] = useState(readHash)

  function select(nextScreen: string, nextVariant: string) {
    window.location.hash = `${nextScreen}/${nextVariant}`
    setSelection([nextScreen, nextVariant])
  }

  const current = screens[screen]

  return (
    <>
      <div className="preview-bar" role="region" aria-label="Galería de diseño">
        <span className="preview-tag">Galería de diseño · datos falsos</span>
        <label className="preview-select">
          <span className="visually-hidden">Pantalla</span>
          <select
            value={screen}
            onChange={(event) => select(event.target.value, Object.keys(screens[event.target.value].variants)[0])}
          >
            {Object.entries(screens).map(([id, item]) => (
              <option key={id} value={id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="preview-select">
          <span className="visually-hidden">Estado</span>
          <select value={variant} onChange={(event) => select(screen, event.target.value)}>
            {Object.entries(current.variants).map(([id, item]) => (
              <option key={id} value={id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div key={`${screen}/${variant}`}>{current.variants[variant].render()}</div>
    </>
  )
}
