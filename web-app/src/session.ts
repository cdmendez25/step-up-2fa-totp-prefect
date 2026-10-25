// Tokens de la sesión en sessionStorage: sobreviven a recargar la página y se
// borran al cerrar la pestaña.
//
// Trade-off de seguridad: cualquier script que corra en la página podría leerlos
// si hubiera una vulnerabilidad XSS. En producción lo más seguro es una cookie
// HttpOnly que JavaScript no puede leer.

export interface Session {
  username?: string
  preAuthToken?: string
  preAuthScope?: string
  /** Marca de tiempo (ms) en que vence el pre_auth_token. */
  preAuthExpiresAt?: number
  /** Duración total del pre_auth_token (ms), para la barra de tiempo. */
  preAuthTtlMs?: number
  accessToken?: string
}

const KEY = 'step-up-2fa.session'

export function readSession(): Session {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Session
  } catch {
    return {}
  }
}

export function updateSession(patch: Partial<Session>): void {
  sessionStorage.setItem(KEY, JSON.stringify({ ...readSession(), ...patch }))
}

export function clearSession(): void {
  sessionStorage.removeItem(KEY)
}
