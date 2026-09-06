// src/admin/editors/StringEditor.tsx
import { Input } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

export default function StringEditor({ field, value, onChange, autoFocus }: EditorProps) {
  const { id, hintId } = useFieldControl()
  return (
    <Input
      id={id}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      aria-required={field.required || undefined}
      aria-describedby={hintId}
      autoFocus={autoFocus}
    />
  )
}
