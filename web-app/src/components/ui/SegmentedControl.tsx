import { Icon, type IconName } from './Icon'
import './ui.css'

export interface SegmentedOption<Value extends string> {
  value: Value
  label: string
  icon?: IconName
}

interface SegmentedControlProps<Value extends string> {
  name: string
  /** Texto para lectores de pantalla (no se ve). */
  legend: string
  options: SegmentedOption<Value>[]
  value: Value
  onChange: (value: Value) => void
}

export function SegmentedControl<Value extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option) => {
        const id = `${name}-${option.value}`
        return (
          <div key={option.value} className="segmented-item">
            <input
              type="radio"
              id={id}
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <label htmlFor={id}>
              {option.icon && <Icon name={option.icon} size={18} />}
              {option.label}
            </label>
          </div>
        )
      })}
    </fieldset>
  )
}
