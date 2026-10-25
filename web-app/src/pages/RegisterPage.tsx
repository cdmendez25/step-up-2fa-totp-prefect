import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, api } from '../api/client'
import { RegisterScreen, type RegisterField, type RegisterValues } from '../screens/RegisterScreen'
import type { FieldErrors } from '../types/ui'

const emptyValues: RegisterValues = { username: '', email: '', password: '', confirmPassword: '' }

function validate(values: RegisterValues): FieldErrors<RegisterField> {
  const errors: FieldErrors<RegisterField> = {}
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(values.username)) {
    errors.username = 'De 3 a 40 caracteres: letras, números, punto, guion o guion bajo.'
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) errors.email = 'El correo no es válido.'
  if (values.password.length < 8) errors.password = 'Debe tener al menos 8 caracteres.'
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Las contraseñas no coinciden.'
  return errors
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<RegisterValues>(emptyValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    setError(null)
    try {
      await api.register(values.username, values.email.trim(), values.password)
      setValues(emptyValues)
      setSuccess('Ya puedes iniciar sesión. Te llevamos al login…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Ocurrió un error inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RegisterScreen
      values={values}
      onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      success={success}
      fieldErrors={fieldErrors}
      onGoToLogin={() => navigate('/login')}
    />
  )
}
