import type { FlowRunState, PipelineTask, TaskName, TaskState, TotpWindow } from '../../types/ui'
import { Badge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import '../ui/ui.css'
import './pipeline.css'

const taskDescriptions: Record<TaskName, string> = {
  validate_pre_auth_state: '¿El pre_auth_token es válido y no ha expirado?',
  check_anti_replay_cache: '¿El par (user_id, código) ya se usó en los últimos 90 s?',
  execute_mfa_strategy: 'Strategy: TOTPStrategy o BackupCodeStrategy.',
  issue_elevated_session: 'Marca el código como usado y emite el JWT final.',
}

const stateLabels: Record<TaskState, string> = {
  pending: 'En espera',
  running: 'Ejecutando',
  completed: 'Completado',
  failed: 'Falló',
  skipped: 'Omitido',
}

const runBadges: Record<FlowRunState, { tone: 'neutral' | 'info' | 'success' | 'danger'; label: string }> = {
  idle: { tone: 'neutral', label: 'Sin ejecutar' },
  running: { tone: 'info', label: 'Running' },
  completed: { tone: 'success', label: 'Completed' },
  failed: { tone: 'danger', label: 'Failed' },
}

const windows: Array<{ value: TotpWindow; label: string }> = [
  { value: -1, label: 'C−1' },
  { value: 0, label: 'C' },
  { value: 1, label: 'C+1' },
]

interface PipelinePanelProps {
  tasks: PipelineTask[]
  runState: FlowRunState
  /** Muestra las ventanas C-1 / C / C+1 bajo execute_mfa_strategy. */
  showTotpWindows?: boolean
  /** Ventana que hizo match (null = todavía ninguna). */
  matchedWindow?: TotpWindow | null
  flowRunId?: string | null
  /** URL del flow run en Prefect UI. */
  prefectUrl?: string
}

export function PipelinePanel({
  tasks,
  runState,
  showTotpWindows = true,
  matchedWindow = null,
  flowRunId = null,
  prefectUrl = 'http://127.0.0.1:4200',
}: PipelinePanelProps) {
  const badge = runBadges[runState]

  return (
    <section className="card pipeline-card" aria-labelledby="pipeline-title">
      <div className="card-header">
        <div className="pipeline-title">
          <Icon name="activity" />
          <h2 id="pipeline-title">Flow en Prefect</h2>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <ol className="pipeline" aria-live="polite">
        {tasks.map((task, index) => (
          <li key={task.name} className="task" data-state={task.state}>
            <span className="task-dot" aria-hidden="true" />
            <div className="task-body">
              <p className="task-name">
                <span className="task-index">{index + 1}</span>
                {task.name}
              </p>
              <p className="task-desc">{taskDescriptions[task.name]}</p>

              {showTotpWindows && task.name === 'execute_mfa_strategy' && (
                <div className="window-chips" role="group" aria-label="Ventana TOTP que hizo match">
                  {windows.map((window) => (
                    <span
                      key={window.value}
                      className="window-chip"
                      data-active={window.value === matchedWindow || undefined}
                    >
                      {window.label}
                      {window.value === matchedWindow && <span className="visually-hidden"> (match)</span>}
                    </span>
                  ))}
                </div>
              )}

              {task.detail && <p className="task-detail">{task.detail}</p>}
            </div>
            <span className="task-status">{stateLabels[task.state]}</span>
          </li>
        ))}
      </ol>

      <div className="pipeline-foot">
        <span className="mono muted">flow run: {flowRunId ?? '—'}</span>
        <a href={prefectUrl} target="_blank" rel="noreferrer" className="pipeline-link">
          Abrir en Prefect UI
          <Icon name="external-link" size={16} />
        </a>
      </div>
    </section>
  )
}
