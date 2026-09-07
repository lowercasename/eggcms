// src/admin/components/ui/Stepper.tsx
import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface StepperProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  'aria-label': string
  id?: string
  placeholder?: string
  disabled?: boolean
}

/** A number control with big − and + buttons and a typeable mono value. */
export default function Stepper({ value, onChange, min, max, step = 1, id, placeholder, disabled, ...props }: StepperProps) {
  const current = typeof value === 'number' && !Number.isNaN(value) ? value : null
  const [text, setText] = useState(current === null ? '' : String(current))
  useEffect(() => {
    setText((typed) => {
      // "2." and "-" are on the way to a number and must not be corrected
      // under the person's fingers; only a value from elsewhere rewrites the box.
      const saysCurrent = Number(typed) === current || (typed.trim() === '' && current === null) || typed === '-'
      if (saysCurrent) return typed
      return current === null ? '' : String(current)
    })
  }, [current])
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
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={props['aria-label']}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value
          if (!/^-?\d*[.,]?\d*$/.test(raw)) return
          setText(raw)
          const trimmed = raw.trim().replace(',', '.')
          if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return onChange(null)
          const n = Number(trimmed)
          if (!Number.isNaN(n)) onChange(n)
        }}
        className="w-[76px] text-center font-mono text-[17px] text-ink bg-transparent outline-none py-[10px] focus-visible:outline-none placeholder:text-ink-3 placeholder:italic"
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
