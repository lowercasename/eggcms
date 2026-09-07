// src/admin/editors/NumberEditor.tsx
import { Stepper } from '../components/ui'
import { getFieldLabel } from '../types'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

export default function NumberEditor({ field, value, onChange }: EditorProps) {
  const { id } = useFieldControl()
  return (
    <Stepper
      id={id}
      aria-label={getFieldLabel(field)}
      value={typeof value === 'number' ? value : null}
      onChange={(n) => onChange(n)}
      placeholder={field.placeholder}
    />
  )
}
