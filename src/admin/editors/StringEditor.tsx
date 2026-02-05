// src/admin/editors/StringEditor.tsx
import type { FieldDefinition } from '../types'
import { Input } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function StringEditor({ field, value, onChange }: Props) {
  return (
    <Input
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  )
}
