// src/admin/editors/DatetimeEditor.tsx
import type { FieldDefinition } from '../types'
import { Input } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function DatetimeEditor({ value, onChange }: Props) {
  // Convert ISO string to datetime-local format
  const toLocalDatetime = (iso: string | null | undefined) => {
    if (!iso) return ''
    const date = new Date(iso)
    return date.toISOString().slice(0, 16)
  }

  return (
    <Input
      type="datetime-local"
      value={toLocalDatetime(value as string)}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value).toISOString() : null
        onChange(date)
      }}
    />
  )
}
