// src/admin/editors/SelectEditor.tsx
import type { FieldDefinition } from '../types'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}

export default function SelectEditor({ field, value, onChange }: Props) {
  const options = field.options || []

  return (
    <select
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}
