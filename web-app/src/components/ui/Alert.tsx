import type { ReactNode } from 'react'
import type { AlertVariant } from '../../types/ui'
import { Icon, type IconName } from './Icon'
import './ui.css'

const icons: Record<AlertVariant, IconName> = {
  error: 'circle-x',
  success: 'circle-check',
  warning: 'alert',
  info: 'info',
}

interface AlertProps {
  variant: AlertVariant
  title?: string
  children?: ReactNode
}

export function Alert({ variant, title, children }: AlertProps) {
  return (
    <div className="alert" data-variant={variant} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon name={icons[variant]} />
      <div className="alert-body">
        {title && <strong>{title}</strong>}
        {children && <div className="alert-text">{children}</div>}
      </div>
    </div>
  )
}
