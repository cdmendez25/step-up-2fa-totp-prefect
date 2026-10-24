import type { FormEvent } from 'react'
import type { FieldErrors } from '../types/ui'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import './screens.css'

export type RegisterField = 'username' | 'email' | 'password' | 'confirmPassword'
export type RegisterValues = Record<RegisterField, string>

export interface RegisterScreenProps {
  values: RegisterValues
  onChange: (field: RegisterField, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSubmitting?: boolean
  error?: string | null
  /** Mensaje cuando la cuenta se creó bien. */
  success?: string | null
  fieldErrors?: FieldErrors<RegisterField>
  onGoToLogin: () => void
}

export function RegisterScreen({
  values,
  onChange,
  onSubmit,
  isSubmitting = false,
  error,
  success,
  fieldErrors = {},
  onGoToLogin,
}: RegisterScreenProps) {
  return (
    <AuthLayout>
      <div className="auth-card">
        <header className="auth-header">
          <span className="step-label">Nueva cuenta</span>
          <h1>Crear cuenta</h1>
          <p>Después de entrar podrás activar la verificación en dos pasos desde Seguridad.</p>
        </header>

        {error && <Alert variant="error">{error}</Alert>}
        {success && (
          <Alert variant="success" title="Cuenta creada">
            {success}
          </Alert>
        )}

        <form className="stack" onSubmit={onSubmit} noValidate>
          <TextField
            id="register-username"
            label="Usuario"
            value={values.username}
            onValueChange={(value) => onChange('username', value)}
            error={fieldErrors.username}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <TextField
            id="register-email"
            label="Correo"
            type="email"
            value={values.email}
            onValueChange={(value) => onChange('email', value)}
            error={fieldErrors.email}
            autoComplete="email"
            required
          />
          <TextField
            id="register-password"
            label="Contraseña"
            type="password"
            value={values.password}
            onValueChange={(value) => onChange('password', value)}
            error={fieldErrors.password}
            hint="Mínimo 8 caracteres."
            autoComplete="new-password"
            required
          />
          <TextField
            id="register-confirm"
            label="Confirmar contraseña"
            type="password"
            value={values.confirmPassword}
            onValueChange={(value) => onChange('confirmPassword', value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
            required
          />
          <Button type="submit" block icon="user-plus" loading={isSubmitting}>
            Crear cuenta
          </Button>
        </form>

        <p className="auth-foot">
          ¿Ya tienes cuenta?{' '}
          <Button variant="link" onClick={onGoToLogin}>
            Iniciar sesión
          </Button>
        </p>
      </div>
    </AuthLayout>
  )
}
