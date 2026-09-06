// src/admin/components/ui/Stepper.tsx
import { Minus, Plus } from 'lucide-react'

interface StepperProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  'aria-label': string
  placeholder?: string
  disabled?: boolean
}

/** A number control with big − and + buttons and a typeable mono value. */
export default function Stepper({ value, onChange, min, max, step = 1, placeholder, disabled, ...props }: StepperProps) {
  const current = typeof value === 'number' && !Number.isNaN(value) ? value : null
  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }
  const nudge = (delta: number) => onChange(clamp((current ?? 0) + delta))
  const atMin = min !== undefined && current !== null && current <= min
  const atMax = max !== undefined && current !== null && current >= max

  return (
    <div className="control inline-flex self-start items-stretch overflow-hidden">
      <button
        type="button"
        aria-label="Decrease"
        disabled={disabled || atMin}
        onClick={() => nudge(-step)}
        className="px-[15px] text-ink-nav text-[18px] border-r-[1.5px] border-line-input hover:bg-page disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-offset-[-3px]"
      >
        <Minus className="w-[18px] h-[18px]" aria-hidden />
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label={props['aria-label']}
        value={current ?? ''}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value.trim()
          if (raw === '' || raw === '-') return onChange(null)
          const n = Number(raw)
          if (!Number.isNaN(n)) onChange(n)
        }}
        className="w-[76px] text-center font-mono text-[17px] text-ink bg-transparent outline-none py-[10px] focus-visible:outline-none"
      />
      <button
        type="button"
        aria-label="Increase"
        disabled={disabled || atMax}
        onClick={() => nudge(step)}
        className="px-[15px] text-ink-nav text-[18px] border-l-[1.5px] border-line-input hover:bg-page disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-offset-[-3px]"
      >
        <Plus className="w-[18px] h-[18px]" aria-hidden />
      </button>
    </div>
  )
}
