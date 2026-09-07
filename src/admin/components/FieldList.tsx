// src/admin/components/FieldList.tsx
import type { FieldDefinition } from '../types'
import type { EditorMap } from '../editors/types'
import { editorMap as defaultEditors } from '../editors'
import FormField, { isTallField } from './ui/FormField'
import Card from './ui/Card'

interface FieldListProps {
  fields: FieldDefinition[]
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  /** Label column width for scalar rows. */
  labelWidth?: number
  /** Draw attention to one field, with a sentence of help, and focus it. */
  highlight?: { field: string; hint?: string }
  /** Editor components by field type. Defaults to the app's registry. */
  editors?: EditorMap
  className?: string
}

/** A run of consecutive fields that share one card (scalars) or stand alone (tall). */
type Group = { kind: 'card'; fields: FieldDefinition[] } | { kind: 'tall'; field: FieldDefinition }

function groupFields(fields: FieldDefinition[]): Group[] {
  const groups: Group[] = []
  for (const field of fields) {
    if (isTallField(field)) {
      groups.push({ kind: 'tall', field })
      continue
    }
    const last = groups[groups.length - 1]
    if (last && last.kind === 'card') last.fields.push(field)
    else groups.push({ kind: 'card', fields: [field] })
  }
  return groups
}

/** "12 blocks", "List · 3" or "Empty" for a blocks field, judged from its value. */
function blocksChip(field: FieldDefinition, value: unknown): string {
  const n = Array.isArray(value) ? value.length : 0
  if (n === 0) return 'Empty'
  if ((field.blocks?.length ?? 0) === 1) return `List · ${n}`
  return `${n} block${n === 1 ? '' : 's'}`
}

/** Shown in place of an editor for a field type the admin does not know, so its value is left alone. */
function UnsupportedField({ field }: { field: FieldDefinition }) {
  return (
    <p role="note" className="m-0 px-3 py-[11px] text-[15px] text-ink-2 border-[1.5px] border-dashed border-line-strong rounded-control">
      There is no editor for “{field.type}” fields in this version of the admin. The value is kept as it is.
    </p>
  )
}

/**
 * Renders a schema's fields in order, applying the layout rule: consecutive
 * scalar fields share one white card, tall fields take the full width.
 */
export default function FieldList({ fields, data, onChange, labelWidth, highlight, editors, className = '' }: FieldListProps) {
  const map = editors ?? defaultEditors

  const renderField = (field: FieldDefinition) => {
    const Editor = map[field.type] ?? UnsupportedField
    const isHighlighted = highlight?.field === field.name
    return (
      <FormField
        key={field.name}
        field={field}
        labelWidth={labelWidth}
        highlight={isHighlighted}
        hint={isHighlighted ? highlight?.hint : undefined}
        chip={field.type === 'blocks' ? blocksChip(field, data[field.name]) : undefined}
      >
        <Editor
          field={field}
          value={data[field.name]}
          onChange={(v) => onChange({ ...data, [field.name]: v })}
          formData={data}
          autoFocus={isHighlighted || undefined}
        />
      </FormField>
    )
  }

  return (
    <div className={`flex flex-col gap-[22px] ${className}`}>
      {groupFields(fields).map((group, i) =>
        group.kind === 'card' ? (
          <Card key={i} data-testid="field-card" divided>
            {group.fields.map(renderField)}
          </Card>
        ) : (
          renderField(group.field)
        )
      )}
    </div>
  )
}
