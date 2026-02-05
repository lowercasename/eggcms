// src/admin/editors/BooleanEditor.tsx
import type { FieldDefinition } from '../types'
import { Toggle } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function BooleanEditor({ value, onChange }: Props) {
  return (
    <Toggle
      checked={!!value}
      onChange={(checked) => onChange(checked)}
    />
  )
}
