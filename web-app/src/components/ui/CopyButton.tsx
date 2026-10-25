import { useEffect, useState } from 'react'
import { Button } from './Button'
import './ui.css'

interface CopyButtonProps {
  onCopy: () => void
  label?: string
  disabled?: boolean
  variant?: 'ghost' | 'secondary'
}

/** Botón de copiar que confirma con "Copiado ✓" durante un momento. */
export function CopyButton({ onCopy, label = 'Copiar', disabled, variant = 'ghost' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      variant={variant}
      size="sm"
      icon={copied ? 'check' : 'copy'}
      onClick={() => {
        onCopy()
        setCopied(true)
      }}
      disabled={disabled}
      data-copied={copied || undefined}
      aria-live="polite"
    >
      {copied ? 'Copiado' : label}
    </Button>
  )
}
