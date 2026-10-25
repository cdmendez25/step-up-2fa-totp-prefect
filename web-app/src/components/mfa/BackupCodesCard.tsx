import type { BackupCode } from '../../types/ui'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { CopyButton } from '../ui/CopyButton'
import '../ui/ui.css'
import './mfa.css'

interface BackupCodesCardProps {
  codes: BackupCode[]
  onCopy: () => void
  onDownload: () => void
}

export function BackupCodesCard({ codes, onCopy, onDownload }: BackupCodesCardProps) {
  return (
    <section className="card" aria-labelledby="backup-title">
      <div className="card-header">
        <div className="stack-sm">
          <h2 id="backup-title">Códigos de respaldo</h2>
          <p className="muted">Úsalos si pierdes tu teléfono. Cada código sirve una sola vez.</p>
        </div>
        <div className="actions">
          <CopyButton variant="secondary" onCopy={onCopy} />
          <Button variant="secondary" size="sm" icon="download" onClick={onDownload}>
            Descargar .txt
          </Button>
        </div>
      </div>

      <ol className="backup-grid">
        {codes.map(({ code, used }) => (
          <li key={code} data-used={used || undefined}>
            <code>{code}</code>
            {used && <span className="visually-hidden"> (usado)</span>}
          </li>
        ))}
      </ol>

      <Alert variant="warning" title="Guárdalos ahora">
        Por seguridad, el servidor solo guarda el hash de cada código: no podrás volver a verlos.
      </Alert>
    </section>
  )
}
