// Datos FALSOS solo para la galería de diseño. Nada de esto sale de tu backend.
// Se borra junto con toda la carpeta design-preview/ (ver README.md).
import type { BackupCode, PipelineTask, TaskState, TokenClaims } from '../types/ui'

export const noop = () => {}

const taskNames = [
  'validate_pre_auth_state',
  'check_anti_replay_cache',
  'execute_mfa_strategy',
  'issue_elevated_session',
] as const

function pipeline(states: [TaskState, TaskState, TaskState, TaskState], details: Array<string | undefined> = []) {
  return taskNames.map<PipelineTask>((name, index) => ({ name, state: states[index], detail: details[index] }))
}

export const pipelineIdle = pipeline(['pending', 'pending', 'pending', 'pending'])

export const pipelineRunning = pipeline(['completed', 'completed', 'running', 'pending'])

export const pipelineSuccess = pipeline(
  ['completed', 'completed', 'completed', 'completed'],
  [undefined, undefined, 'TOTPStrategy → match en ventana C-1 (reloj del celular atrasado)', 'JWT emitido · mfa_verified=true'],
)

export const pipelineReplay = pipeline(
  ['completed', 'failed', 'skipped', 'skipped'],
  [undefined, 'ReplayAttackDetected: (user 42, 482913) ya se usó hace 12 s'],
)

export const pipelineBackup = pipeline(
  ['completed', 'completed', 'completed', 'completed'],
  [undefined, undefined, 'BackupCodeStrategy → código 03 consumido', 'JWT emitido · mfa_verified=true'],
)

export const sampleSecret = 'JBSW Y3DP EHPK 3PXP JBSW Y3DP'

export const sampleBackupCodes: BackupCode[] = [
  { code: '7KQ2-M9XD', used: false },
  { code: 'P4TR-8WNZ', used: false },
  { code: 'C3HV-2LQS', used: true },
  { code: 'Y6BF-JK7E', used: false },
  { code: 'R2MD-5XPA', used: false },
  { code: 'N8GW-QT3C', used: false },
  { code: 'H5ZL-9VRB', used: false },
  { code: 'E1UK-6YSM', used: false },
]

export const sampleClaims: TokenClaims = {
  sub: '42',
  username: 'carlos',
  mfa_verified: true,
  amr: 'pwd+totp',
  iat: 1793102400,
  exp: 1793103300,
}

// Texto de ejemplo, a propósito SIN forma de JWT real para no disparar gitleaks.
export const sampleToken = 'eyJhbGciOi… (token de ejemplo recortado)'

export const sampleSecretMessage =
  'Si estás leyendo esto, pasaste por los dos factores: algo que sabes (tu contraseña) y algo que tienes (tu teléfono).'
