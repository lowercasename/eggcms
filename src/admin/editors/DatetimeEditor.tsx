// src/admin/editors/DatetimeEditor.tsx
import { useState } from 'react'
import { Clock, X } from 'lucide-react'
import { Input, Button } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import { getFieldLabel } from '../types'
import type { EditorProps } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** The local calendar day and wall-clock time of an ISO instant, or nothing. */
function parts(iso: unknown): { date: string; time: string } | null {
  if (typeof iso !== 'string' || !iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/** Local day + wall-clock time → the instant, as ISO. */
function toIso(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}`).toISOString()
}

/**
 * A date picker, with a time picker only when a time matters. A date on its
 * own is stored as midnight local time, so the field can be saved with just a
 * date; "Add time" reveals the time, "Remove time" drops it again.
 */
export default function DatetimeEditor({ field, value, onChange }: EditorProps) {
  const { id, hintId } = useFieldControl()
  const current = parts(value)
  const [showTime, setShowTime] = useState(() => !!current && current.time !== '00:00')
  const hasTime = showTime || (!!current && current.time !== '00:00')

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Input
        id={id}
        type="date"
        aria-label={id ? undefined : getFieldLabel(field)}
        value={current?.date ?? ''}
        onChange={(e) => onChange(e.target.value ? toIso(e.target.value, hasTime ? current?.time ?? '' : '') : null)}
        aria-required={field.required || undefined}
        aria-describedby={hintId}
        className="!w-auto"
      />
      {hasTime ? (
        <>
          <Input
            type="time"
            aria-label="Time"
            value={current?.time ?? ''}
            onChange={(e) => {
              if (current) onChange(toIso(current.date, e.target.value))
            }}
            className="!w-auto"
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<X aria-hidden />}
            onClick={() => {
              setShowTime(false)
              if (current) onChange(toIso(current.date, ''))
            }}
          >
            Remove time
          </Button>
        </>
      ) : (
        <Button variant="secondary" size="sm" icon={<Clock aria-hidden />} onClick={() => setShowTime(true)}>
          Add time
        </Button>
      )}
    </div>
  )
}
