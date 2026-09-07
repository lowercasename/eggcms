// src/admin/editors/BooleanEditor.tsx
import { Toggle } from '../components/ui'
import { getFieldLabel } from '../types'
import { useFieldControl } from '../components/ui/FieldContext'
import type { EditorProps } from './types'

export default function BooleanEditor({ field, value, onChange }: EditorProps) {
  const { id } = useFieldControl()
  return <Toggle id={id} aria-label={getFieldLabel(field)} checked={!!value} onChange={(checked) => onChange(checked)} />
}
