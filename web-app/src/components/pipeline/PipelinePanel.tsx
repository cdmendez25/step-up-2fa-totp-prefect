import { useEffect, useState } from 'react'
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

// Tiempo entre una task y la siguiente al revelar el resultado.
const STEP_MS = 420

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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
  // El backend devuelve el resultado completo de una vez; aquí se revela task por task,
  // en el mismo orden en que Prefect las ejecutó.
  const isFinal = runState === 'completed' || runState === 'failed'
  const animate = isFinal && !prefersReducedMotion()
  const signature = `${runState}|${flowRunId ?? ''}|${tasks.map((task) => task.state).join(',')}`
  const failedIndex = tasks.findIndex((task) => task.state === 'failed')
  const steps = failedIndex >= 0 ? failedIndex + 1 : tasks.length

  const [reveal, setReveal] = useState({ key: signature, count: animate ? 0 : tasks.length })
  if (reveal.key !== signature) {
    setReveal({ key: signature, count: animate ? 0 : tasks.length })
  }

  useEffect(() => {
    if (!animate) return
    // Cancelable: si llega otro resultado a mitad de la animación, estos timers se descartan.
    const timers = Array.from({ length: steps }, (_, index) =>
      setTimeout(() => {
        const count = index + 1 === steps ? tasks.length : index + 1
        setReveal((current) => (current.key === signature ? { ...current, count } : current))
      }, (index + 1) * STEP_MS),
    )
    return () => timers.forEach(clearTimeout)
  }, [animate, signature, steps, tasks.length])

  const done = reveal.count >= tasks.length
  const shownTasks = tasks.map((task, index): PipelineTask => {
    if (done || index < reveal.count) return task
    if (index === reveal.count) return { name: task.name, state: 'running' }
    return { name: task.name, state: 'pending' }
  })
  const badge = runBadges[done ? runState : 'running']

  return (
    <section className="card pipeline-card" aria-labelledby="pipeline-title" data-run-state={done ? runState : 'running'}>
      <div className="card-header">
        <div className="pipeline-title">
          <Icon name="activity" />
          <h2 id="pipeline-title">Flow en Prefect</h2>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <ol className="pipeline" aria-live="polite">
        {shownTasks.map((task, index) => (
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
                  {windows.map((window) => {
                    const isMatch = done && window.value === matchedWindow
                    return (
                      <span key={window.value} className="window-chip" data-active={isMatch || undefined}>
                        {window.label}
                        {isMatch && <span className="visually-hidden"> (match)</span>}
                      </span>
                    )
                  })}
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
