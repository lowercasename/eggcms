// src/admin/editors/TextEditor.tsx
import type { FieldDefinition } from '../types'
import { Textarea } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function TextEditor({ field, value, onChange }: Props) {
  return (
    <Textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={5}
    />
  )
}
