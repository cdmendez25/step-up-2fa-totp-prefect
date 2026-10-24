// Tipos que usan los componentes de la UI. Tu lógica puede reutilizarlos
// para que lo que devuelva tu backend encaje con lo que la pantalla espera.

/** Estado de una task de Prefect, tal como se pinta en el pipeline. */
export type TaskState = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

/** Las 4 tasks del flow de verificación (sección 4 de la guía). */
export type TaskName =
  | 'validate_pre_auth_state'
  | 'check_anti_replay_cache'
  | 'execute_mfa_strategy'
  | 'issue_elevated_session'

export interface PipelineTask {
  name: TaskName
  state: TaskState
  /** Texto corto opcional, p. ej. "Match en ventana C-1" o "ReplayAttackDetected". */
  detail?: string
}

/** Estado global del flow run (badge del encabezado del pipeline). */
export type FlowRunState = 'idle' | 'running' | 'completed' | 'failed'

/** Ventana TOTP en la que hizo match el código: C-1, C o C+1. */
export type TotpWindow = -1 | 0 | 1

/** Máquina de estados del aprovisionamiento del 2FA. */
export type MfaStatus = 'NONE' | 'PENDING_VERIFICATION' | 'ACTIVE'

/** Un código de respaldo y si ya se consumió. */
export interface BackupCode {
  code: string
  used: boolean
}

/** Estrategia de segundo factor que eligió el usuario. */
export type SecondFactor = 'totp' | 'backup'

/** Paso actual del flujo Step-Up (panel lateral de las pantallas de acceso). */
export type AuthStep = 1 | 2 | 3

/** Secciones de la navegación superior en pantallas autenticadas. */
export type AppSection = 'vault' | 'security'

export type AlertVariant = 'error' | 'success' | 'warning' | 'info'

/** Errores por campo de un formulario: { username: "Obligatorio" }. */
export type FieldErrors<Field extends string> = Partial<Record<Field, string>>

/** Claims del access_token que se muestran en la bóveda. */
export interface TokenClaims {
  sub: string
  mfa_verified: boolean
  iat: number
  exp: number
  [claim: string]: string | number | boolean
}

export type VaultState = 'loading' | 'granted' | 'denied'
