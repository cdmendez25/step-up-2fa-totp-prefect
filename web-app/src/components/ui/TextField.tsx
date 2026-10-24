import type { InputHTMLAttributes } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import './ui.css'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'> {
  id: string
  label: string
  value: string
  /** Recibe el texto ya extraído del evento: onValueChange={setUsername}. */
  onValueChange: (value: string) => void
  hint?: string
  error?: string
  /** "otp" = código de 6 dígitos grande; "backup" = código de respaldo. */
  variant?: 'default' | 'otp' | 'backup'
}

export function TextField({
  id,
  label,
  value,
  onValueChange,
  hint,
  error,
  variant = 'default',
  className,
  ...inputProps
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={cx('input', variant === 'otp' && 'input-otp', variant === 'backup' && 'input-backup', className)}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(hintId, errorId) || undefined}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          <Icon name="circle-x" size={16} />
          {error}
        </p>
      )}
    </div>
  )
}
