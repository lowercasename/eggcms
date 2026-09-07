// src/admin/editors/DatetimeEditor.tsx
import { Input } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

/** ISO instant → the same moment as local wall-clock "YYYY-MM-DDTHH:mm", which is what a datetime-local input shows. */
function toLocalDatetime(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function DatetimeEditor({ field, value, onChange }: EditorProps) {
  const { id, hintId } = useFieldControl()
  return (
    <Input
      id={id}
      type="datetime-local"
      value={toLocalDatetime(value as string)}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
      aria-required={field.required || undefined}
      aria-describedby={hintId}
      className="max-w-[360px]"
    />
  )
}
