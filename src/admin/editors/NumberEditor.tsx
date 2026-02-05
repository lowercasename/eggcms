// src/admin/editors/NumberEditor.tsx
import type { FieldDefinition } from '../types'
import { Input } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function NumberEditor({ field, value, onChange }: Props) {
  return (
    <Input
      type="number"
      value={(value as number) ?? ''}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder={field.placeholder}
    />
  )
}
