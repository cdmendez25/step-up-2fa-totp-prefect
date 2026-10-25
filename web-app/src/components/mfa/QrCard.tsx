import type { ReactNode } from 'react'
import { CopyButton } from '../ui/CopyButton'
import { Icon } from '../ui/Icon'
import '../ui/ui.css'
import './mfa.css'

interface QrCardProps {
  /**
   * El QR ya renderizado. Tú decides cómo generarlo: un <img> con el PNG que
   * devuelva tu backend, o un componente que pinte la URI otpauth://.
   * Si es null, se muestra un marcador de posición.
   */
  qrCode: ReactNode | null
  /** Secreto en Base32 para ingresarlo a mano en la app. */
  secret: string | null
  issuer: string
  accountName: string
  onCopySecret: () => void
}

export function QrCard({ qrCode, secret, issuer, accountName, onCopySecret }: QrCardProps) {
  return (
    <section className="card" aria-labelledby="qr-title">
      <div className="stack-sm">
        <span className="step-label">Paso 1</span>
        <h2 id="qr-title">Escanea el código QR</h2>
        <p className="muted">
          Ábrelo con tu app Authenticator de iOS (o con Google/Microsoft Authenticator para la prueba de paridad).
        </p>
      </div>

      <div className="qr-frame">
        {qrCode ?? (
          <div className="qr-placeholder">
            <Icon name="qr-code" size={40} />
            <span>Aquí aparecerá el QR de la URI otpauth://</span>
          </div>
        )}
      </div>

      <div className="stack-sm">
        <p className="field-label">¿No puedes escanear? Ingresa la clave manualmente</p>
        <div className="secret-box">
          <code aria-label="Clave secreta en Base32">{secret ?? '•••• •••• •••• ••••'}</code>
          <CopyButton onCopy={onCopySecret} disabled={!secret} />
        </div>
      </div>

      <dl className="spec-list">
        <div>
          <dt>Emisor</dt>
          <dd>{issuer}</dd>
        </div>
        <div>
          <dt>Cuenta</dt>
          <dd>{accountName}</dd>
        </div>
        <div>
          <dt>Algoritmo</dt>
          <dd>SHA1</dd>
        </div>
        <div>
          <dt>Dígitos · Periodo</dt>
          <dd>6 · 30 s</dd>
        </div>
      </dl>
    </section>
  )
}
