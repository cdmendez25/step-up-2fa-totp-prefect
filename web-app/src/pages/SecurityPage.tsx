import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ApiError, api, type SetupResponse } from '../api/client'
import { SetupMfaScreen } from '../screens/SetupMfaScreen'
import { clearSession, readSession, updateSession } from '../session'
import type { AppSection, BackupCode, MfaStatus } from '../types/ui'

function messageOf(caught: unknown): string {
  return caught instanceof ApiError ? caught.message : 'Ocurrió un error inesperado.'
}

function groupsOfFour(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function SecurityPage() {
  const navigate = useNavigate()
  const [session] = useState(readSession)
  // El token de configuración (scope mfa:setup) solo existe si el 2FA aún no estaba activo al hacer login.
  const setupToken = session.preAuthScope === 'mfa:setup' ? session.preAuthToken : undefined

  const [status, setStatus] = useState<MfaStatus | null>(setupToken ? null : 'ACTIVE')
  const [setup, setSetup] = useState<SetupResponse | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [confirmCode, setConfirmCode] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([])

  useEffect(() => {
    if (!setupToken) return
    let cancelled = false
    api
      .mfaStatus(setupToken)
      .then((result) => !cancelled && setStatus(result.status))
      .catch((caught) => {
        if (cancelled) return
        setStatus('NONE')
        setStartError(messageOf(caught))
      })
    return () => {
      cancelled = true
    }
  }, [setupToken])

  if (!setupToken && !session.accessToken) {
    return <Navigate to="/login" replace />
  }

  async function handleStart() {
    if (!setupToken) return
    setIsStarting(true)
    setStartError(null)
    try {
      setSetup(await api.mfaSetup(setupToken))
      setStatus('PENDING_VERIFICATION')
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) setStatus('ACTIVE')
      else setStartError(messageOf(caught))
    } finally {
      setIsStarting(false)
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!setupToken) return
    if (!/^\d{6}$/.test(confirmCode)) {
      setConfirmError('Escribe los 6 dígitos que muestra tu app.')
      return
    }
    setIsConfirming(true)
    setConfirmError(null)
    try {
      const result = await api.mfaConfirm(setupToken, confirmCode)
      setBackupCodes(result.backup_codes.map((code) => ({ code, used: false })))
      // El backend entrega un token nuevo, ahora con scope mfa:verify, para el paso 2 del Step-Up.
      updateSession({
        preAuthToken: result.pre_auth_token,
        preAuthScope: 'mfa:verify',
        preAuthExpiresAt: Date.now() + result.expires_in * 1000,
      })
      setStatus('ACTIVE')
    } catch (caught) {
      setConfirmError(messageOf(caught))
    } finally {
      setIsConfirming(false)
    }
  }

  function goToVault() {
    navigate(readSession().accessToken ? '/vault' : '/verify')
  }

  const codesText = backupCodes.map((item) => item.code).join('\n')
  const username = session.username ?? ''

  return (
    <SetupMfaScreen
      username={username}
      onNavigate={(section: AppSection) => (section === 'vault' ? goToVault() : navigate('/security'))}
      onLogout={() => {
        clearSession()
        navigate('/login')
      }}
      status={status ?? 'NONE'}
      onStart={handleStart}
      isStarting={isStarting || status === null}
      startError={startError}
      qrCode={
        setup ? (
          <QRCodeSVG value={setup.otpauth_uri} size={208} level="M" title="Código QR para tu app Authenticator" />
        ) : null
      }
      secret={setup ? groupsOfFour(setup.secret) : null}
      issuer={setup?.issuer ?? 'Boveda 2FA'}
      accountName={setup?.account_name ?? username}
      onCopySecret={() => setup && navigator.clipboard.writeText(setup.secret)}
      confirmCode={confirmCode}
      onConfirmCodeChange={(next) => setConfirmCode(next.replace(/\D/g, '').slice(0, 6))}
      onConfirmSubmit={handleConfirm}
      isConfirming={isConfirming}
      confirmError={confirmError}
      backupCodes={backupCodes}
      onCopyBackupCodes={() => navigator.clipboard.writeText(codesText)}
      onDownloadBackupCodes={() => downloadText('codigos-respaldo-boveda-2fa.txt', codesText)}
      onGoToVault={goToVault}
    />
  )
}
