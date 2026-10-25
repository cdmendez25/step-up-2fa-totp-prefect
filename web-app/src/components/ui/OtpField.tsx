import { useState } from 'react'
import { Icon } from './Icon'
import './ui.css'

interface OtpFieldProps {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  error?: string
  /** "error" hace temblar las casillas; "success" las pinta de verde. */
  status?: 'idle' | 'error' | 'success'
  length?: number
  autoFocus?: boolean
}

/**
 * Código de 6 dígitos en casillas. Debajo hay un solo <input> invisible, así que
 * pegar, autocompletar (one-time-code) y los lectores de pantalla funcionan igual.
 */
export function OtpField({
  id,
  label,
  value,
  onValueChange,
  error,
  status = 'idle',
  length = 6,
  autoFocus = false,
}: OtpFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const errorId = error ? `${id}-error` : undefined
  const shownStatus = error ? 'error' : status
  const activeIndex = Math.min(value.length, length - 1)

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {/* key: cada error nuevo reinicia la animación de temblor */}
      <div className="otp" data-status={shownStatus} key={error ?? shownStatus}>
        {Array.from({ length }, (_, index) => (
          <span
            key={index}
            className="otp-box"
            data-filled={index < value.length || undefined}
            data-active={(isFocused && index === activeIndex && value.length < length) || undefined}
            aria-hidden="true"
          >
            {value[index] ?? ''}
          </span>
        ))}
        <input
          id={id}
          className="otp-input-native"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
      </div>
      {error && (
        <p id={errorId} className="field-error">
          <Icon name="circle-x" size={16} />
          {error}
        </p>
      )}
    </div>
  )
}
