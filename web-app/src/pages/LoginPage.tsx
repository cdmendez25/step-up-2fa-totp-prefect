import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, api } from '../api/client'
import { LoginScreen, type LoginField, type LoginValues } from '../screens/LoginScreen'
import { clearSession, updateSession } from '../session'
import type { FieldErrors } from '../types/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginValues>({ username: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginField>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors: FieldErrors<LoginField> = {}
    if (!values.username.trim()) errors.username = 'Escribe tu usuario o correo.'
    if (!values.password) errors.password = 'Escribe tu contraseña.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await api.login(values.username.trim(), values.password)
      clearSession()
      updateSession({
        username: result.username,
        preAuthToken: result.pre_auth_token,
        preAuthScope: result.scope,
        preAuthExpiresAt: Date.now() + result.expires_in * 1000,
        preAuthTtlMs: result.expires_in * 1000,
      })
      // 2FA activo → paso 2 del Step-Up. Si no, primero hay que configurarlo.
      navigate(result.mfa_status === 'ACTIVE' ? '/verify' : '/security')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Ocurrió un error inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LoginScreen
      values={values}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      fieldErrors={fieldErrors}
      onGoToRegister={() => navigate('/register')}
    />
  )
}
