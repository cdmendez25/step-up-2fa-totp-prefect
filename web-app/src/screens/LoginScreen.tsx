import type { FormEvent } from 'react'
import type { FieldErrors } from '../types/ui'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import './screens.css'

export type LoginField = 'username' | 'password'
export type LoginValues = Record<LoginField, string>

export interface LoginScreenProps {
  values: LoginValues
  onChange: (field: LoginField, value: string) => void
  /** Ojo: el formulario no hace preventDefault por ti. */
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting?: boolean
  /** Error general, p. ej. "Usuario o contraseña incorrectos". */
  error?: string | null
  fieldErrors?: FieldErrors<LoginField>
  onGoToRegister: () => void
}

export function LoginScreen({
  values,
  onChange,
  onSubmit,
  isSubmitting = false,
  error,
  fieldErrors = {},
  onGoToRegister,
}: LoginScreenProps) {
  return (
    <AuthLayout currentStep={1}>
      <div className="auth-card">
        <header className="auth-header">
          <span className="step-label">Paso 1 de 2</span>
          <h1>Iniciar sesión</h1>
          <p>Con tus credenciales obtienes un token temporal que solo sirve para verificar tu segundo factor.</p>
        </header>

        {error && <Alert variant="error">{error}</Alert>}

        <form className="stack" onSubmit={onSubmit} noValidate>
          <TextField
            id="login-username"
            label="Usuario o correo"
            value={values.username}
            onValueChange={(value) => onChange('username', value)}
            error={fieldErrors.username}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <TextField
            id="login-password"
            label="Contraseña"
            type="password"
            value={values.password}
            onValueChange={(value) => onChange('password', value)}
            error={fieldErrors.password}
            autoComplete="current-password"
            required
          />
          <Button type="submit" block loading={isSubmitting}>
            Continuar
          </Button>
        </form>

        <p className="auth-foot">
          ¿No tienes cuenta?{' '}
          <Button variant="link" onClick={onGoToRegister}>
            Crear cuenta
          </Button>
        </p>
      </div>
    </AuthLayout>
  )
}
