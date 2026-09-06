// src/admin/editors/NumberEditor.tsx
import { Stepper } from '../components/ui'
import { getFieldLabel } from '../types'
import type { EditorProps } from './types'

export default function NumberEditor({ field, value, onChange }: EditorProps) {
  return (
    <Stepper
      aria-label={getFieldLabel(field)}
      value={typeof value === 'number' ? value : null}
      onChange={(n) => onChange(n)}
      placeholder={field.placeholder}
    />
  )
}
