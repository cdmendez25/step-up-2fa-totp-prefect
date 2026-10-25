import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, api, type VaultResponse } from '../api/client'
import { VaultScreen } from '../screens/VaultScreen'
import { clearSession, readSession } from '../session'
import type { VaultState } from '../types/ui'

export function VaultPage() {
  const navigate = useNavigate()
  const [session] = useState(readSession)
  const accessToken = session.accessToken
  const [state, setState] = useState<VaultState>(accessToken ? 'loading' : 'denied')
  const [data, setData] = useState<VaultResponse | null>(null)
  const [error, setError] = useState<string | null>(
    accessToken ? null : 'Primero verifica tu segundo factor: inicia sesión de nuevo.',
  )

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    api
      .vault(accessToken)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setState('granted')
      })
      .catch((caught) => {
        if (cancelled) return
        setError(caught instanceof ApiError ? caught.message : 'Ocurrió un error inesperado.')
        setState('denied')
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  function logout() {
    clearSession()
    navigate('/login')
  }

  return (
    <VaultScreen
      state={state}
      username={session.username ?? ''}
      onNavigate={(section) => navigate(section === 'vault' ? '/vault' : '/security')}
      onLogout={logout}
      secretMessage={data?.message}
      claims={data?.claims}
      accessToken={accessToken}
      error={error}
      onGoToLogin={logout}
    />
  )
}
