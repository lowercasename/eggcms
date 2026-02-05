// src/admin/editors/TextEditor.tsx
import type { FieldDefinition } from '../types'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function TextEditor({ field, value, onChange }: Props) {
  return (
    <textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={5}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}
