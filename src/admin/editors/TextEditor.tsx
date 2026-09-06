// src/admin/editors/TextEditor.tsx
import { Textarea } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

export default function TextEditor({ field, value, onChange, autoFocus }: EditorProps) {
  const { id, hintId } = useFieldControl()
  return (
    <Textarea
      id={id}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      aria-required={field.required || undefined}
      aria-describedby={hintId}
      autoFocus={autoFocus}
      rows={5}
    />
  )
}
