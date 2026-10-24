import type { MfaStatus } from '../../types/ui'
import './mfa.css'

const states: MfaStatus[] = ['NONE', 'PENDING_VERIFICATION', 'ACTIVE']

interface MfaStateMachineProps {
  status: MfaStatus
}

/** Dibuja la máquina de estados del aprovisionamiento y resalta el actual. */
export function MfaStateMachine({ status }: MfaStateMachineProps) {
  return (
    <ol className="state-machine" aria-label="Estado del 2FA">
      {states.map((state) => (
        <li key={state} data-state={state} aria-current={state === status ? 'step' : undefined}>
          <span>{state}</span>
        </li>
      ))}
    </ol>
  )
}
