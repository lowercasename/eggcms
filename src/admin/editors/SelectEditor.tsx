// src/admin/editors/SelectEditor.tsx
import type { FieldDefinition } from '../types'
import { Select } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function SelectEditor({ field, value, onChange }: Props) {
  const options = (field.options || []).map((opt) => ({
    value: opt,
    label: opt,
  }))

  return (
    <Select
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value || null)}
      options={options}
      placeholder="Select..."
    />
  )
}
