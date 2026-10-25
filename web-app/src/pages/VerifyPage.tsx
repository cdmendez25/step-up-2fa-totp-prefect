import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ApiError, api, type VerifyErrorDetail } from '../api/client'
import { VerifyScreen } from '../screens/VerifyScreen'
import { readSession, updateSession } from '../session'
import type { FlowRunState, PipelineTask, SecondFactor, TotpWindow } from '../types/ui'

const TASK_NAMES: PipelineTask['name'][] = [
  'validate_pre_auth_state',
  'check_anti_replay_cache',
  'execute_mfa_strategy',
  'issue_elevated_session',
]

const idlePipeline: PipelineTask[] = TASK_NAMES.map((name) => ({ name, state: 'pending' }))
const runningPipeline: PipelineTask[] = TASK_NAMES.map((name, index) => ({
  name,
  state: index === 0 ? 'running' : 'pending',
}))

// Cuánto se deja ver el pipeline en verde antes de entrar a la bóveda.
const SUCCESS_PAUSE_MS = 2500

function formatTimeLeft(expiresAt: number | undefined, now: number): string | null {
  if (!expiresAt) return null
  const seconds = Math.max(0, Math.round((expiresAt - now) / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function isPipelineDetail(detail: unknown): detail is VerifyErrorDetail {
  return Boolean(detail && typeof detail === 'object' && 'pipeline' in detail)
}

export function VerifyPage() {
  const navigate = useNavigate()
  // Se lee una sola vez: al verificar se borra el pre_auth_token y no queremos que eso nos saque de la página.
  const [session] = useState(readSession)
  const [factor, setFactor] = useState<SecondFactor>('totp')
  const [code, setCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | undefined>()
  const [pipeline, setPipeline] = useState<PipelineTask[]>(idlePipeline)
  const [runState, setRunState] = useState<FlowRunState>('idle')
  const [matchedWindow, setMatchedWindow] = useState<TotpWindow | null>(null)
  const [flowRunId, setFlowRunId] = useState<string | null>(null)
  const [prefectUrl, setPrefectUrl] = useState<string | undefined>()
  const [now, setNow] = useState(() => Date.now())

  // Reloj de la cuenta regresiva del pre_auth_token.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!session.preAuthToken || session.preAuthScope !== 'mfa:verify') {
    return <Navigate to="/login" replace />
  }
  const preAuthToken = session.preAuthToken

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = factor === 'totp' ? code : backupCode.trim()
    if (factor === 'totp' && !/^\d{6}$/.test(value)) {
      setCodeError('Escribe los 6 dígitos que muestra tu app.')
      return
    }
    if (factor === 'backup' && value.length < 8) {
      setCodeError('Escribe un código de respaldo completo (XXXX-XXXX).')
      return
    }

    setCodeError(undefined)
    setError(null)
    setIsSubmitting(true)
    setRunState('running')
    setPipeline(runningPipeline)
    setMatchedWindow(null)

    try {
      const result = await api.verify2fa(preAuthToken, value, factor)
      setPipeline(result.pipeline)
      setRunState('completed')
      setMatchedWindow(result.matched_window)
      setFlowRunId(result.flow_run_id)
      setPrefectUrl(result.prefect_url)
      updateSession({ accessToken: result.access_token, preAuthToken: undefined, preAuthScope: undefined })
      setTimeout(() => navigate('/vault'), SUCCESS_PAUSE_MS)
    } catch (caught) {
      setRunState('failed')
      if (caught instanceof ApiError && isPipelineDetail(caught.detail)) {
        setPipeline(caught.detail.pipeline)
        setFlowRunId(caught.detail.flow_run_id)
        setPrefectUrl(caught.detail.prefect_url)
        setError(
          caught.detail.error === 'ReplayAttackDetected'
            ? 'Este código ya fue usado. Espera al siguiente código de tu app.'
            : caught.message,
        )
      } else {
        setPipeline(idlePipeline)
        setError(caught instanceof ApiError ? caught.message : 'Ocurrió un error inesperado.')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <VerifyScreen
      factor={factor}
      onFactorChange={(next) => {
        setFactor(next)
        setCodeError(undefined)
      }}
      code={code}
      onCodeChange={(next) => setCode(next.replace(/\D/g, '').slice(0, 6))}
      backupCode={backupCode}
      onBackupCodeChange={(next) => setBackupCode(next.toUpperCase())}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      codeError={codeError}
      preAuthTimeLeft={formatTimeLeft(session.preAuthExpiresAt, now)}
      pipeline={pipeline}
      runState={runState}
      matchedWindow={matchedWindow}
      flowRunId={flowRunId}
      prefectUrl={prefectUrl}
      onBackToLogin={() => navigate('/login')}
    />
  )
}
