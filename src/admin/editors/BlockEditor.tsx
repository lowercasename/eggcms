// src/admin/editors/BlockEditor.tsx
// Editor for a single block field: one group of fields, not an array.
import FieldList from '../components/FieldList'
import type { EditorProps } from './types'

export default function BlockEditor({ field, value, onChange }: EditorProps) {
  const blockValue = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  const def = field.block

  if (!def) {
    return <p className="m-0 p-4 text-center text-[15px] text-ink-2 border-[1.5px] border-dashed border-line-strong rounded-block">No block definition provided.</p>
  }

  return (
    <div className="border-[1.5px] border-line-strong rounded-block bg-panel overflow-hidden">
      <FieldList
        fields={def.fields}
        data={blockValue}
        onChange={(next) => onChange(next)}
        labelWidth={140}
        className="!gap-0 [&>[data-testid=field-card]]:border-0 [&>[data-testid=field-card]]:rounded-none [&>[data-field=tall]]:px-4 [&>[data-field=tall]]:py-3.5"
      />
    </div>
  )
}
