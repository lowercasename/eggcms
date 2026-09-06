// src/admin/editors/SelectEditor.tsx
import { Select } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

export default function SelectEditor({ field, value, onChange }: EditorProps) {
  const { id, hintId } = useFieldControl()
  const options = (field.options || []).map((opt) => ({ value: opt, label: opt }))
  return (
    <Select
      id={id}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value || null)}
      options={options}
      placeholder="Choose…"
      aria-required={field.required || undefined}
      aria-describedby={hintId}
      className="max-w-[360px]"
    />
  )
}
