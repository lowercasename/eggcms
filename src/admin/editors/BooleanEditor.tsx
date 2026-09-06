// src/admin/editors/BooleanEditor.tsx
import { Toggle } from '../components/ui'
import { getFieldLabel } from '../types'
import type { EditorProps } from './types'

export default function BooleanEditor({ field, value, onChange }: EditorProps) {
  return <Toggle aria-label={getFieldLabel(field)} checked={!!value} onChange={(checked) => onChange(checked)} />
}
