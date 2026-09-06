// src/admin/editors/DatetimeEditor.tsx
import { Input } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

/** ISO string → the local value a datetime-local input wants. */
function toLocalDatetime(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
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
