// Cliente tipado del backend FastAPI. La web SOLO habla con el backend, nunca con Supabase.
import type { MfaStatus, PipelineTask, SecondFactor, TokenClaims, TotpWindow } from '../types/ui'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, message: string, detail: unknown) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

export interface LoginResponse {
  pre_auth_token: string
  scope: string
  mfa_status: MfaStatus
  expires_in: number
  username: string
}

export interface SetupResponse {
  status: 'PENDING_VERIFICATION'
  secret: string
  otpauth_uri: string
  issuer: string
  account_name: string
  prefect_url: string
}

export interface ConfirmResponse {
  status: 'ACTIVE'
  backup_codes: string[]
  pre_auth_token: string
  expires_in: number
  prefect_url: string
}

export interface PipelineResult {
  pipeline: PipelineTask[]
  flow_run_id: string
  prefect_url: string
}

export interface VerifyResponse extends PipelineResult {
  access_token: string
  matched_window: TotpWindow | null
}

/** Lo que trae el 401 de /auth/verify-2fa: en qué task se detuvo el flow. */
export interface VerifyErrorDetail extends PipelineResult {
  message: string
  error: string
}

export interface VaultResponse {
  message: string
  claims: TokenClaims
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string
}

async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el backend. ¿Está corriendo en el puerto 8000?', null)
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail
    throw new ApiError(response.status, errorMessage(detail), detail)
  }
  return data as T
}

function errorMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return 'Revisa los datos del formulario.' // validación de FastAPI (422)
  if (detail && typeof detail === 'object' && 'message' in detail) return String(detail.message)
  return 'Ocurrió un error inesperado.'
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request<{ id: string; username: string }>('/auth/register', { method: 'POST', body: { username, email, password } }),

  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { username, password } }),

  mfaStatus: (token: string) => request<{ status: MfaStatus }>('/mfa/status', { token }),

  mfaSetup: (token: string) => request<SetupResponse>('/mfa/setup', { method: 'POST', token }),

  mfaConfirm: (token: string, code: string) =>
    request<ConfirmResponse>('/mfa/confirm', { method: 'POST', token, body: { code } }),

  verify2fa: (preAuthToken: string, code: string, factor: SecondFactor) =>
    request<VerifyResponse>('/auth/verify-2fa', {
      method: 'POST',
      body: { pre_auth_token: preAuthToken, code, factor },
    }),

  vault: (token: string) => request<VaultResponse>('/api/boveda-secreta', { token }),
}
