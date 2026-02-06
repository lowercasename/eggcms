// src/admin/editors/BlockEditor.tsx
// Editor for a single block field (not an array of blocks)
import type { FieldDefinition, BlockDefinition } from '../types'
import { getFieldLabel } from '../types'
import { FormField, Card } from '../components/ui'

// Import all editors for rendering block fields
import StringEditor from './StringEditor'
import TextEditor from './TextEditor'
import NumberEditor from './NumberEditor'
import BooleanEditor from './BooleanEditor'
import RichtextEditor from './RichtextEditor'
import DatetimeEditor from './DatetimeEditor'
import SelectEditor from './SelectEditor'
import SlugEditor from './SlugEditor'
import ImageEditor from './ImageEditor'

interface Props {
  field: FieldDefinition & { block?: BlockDefinition }
  value: unknown
  onChange: (v: unknown) => void
}

// Editor map - block added after to enable recursion
const editorMap: Record<string, React.ComponentType<{ field: FieldDefinition; value: unknown; onChange: (v: unknown) => void; formData?: Record<string, unknown> }>> = {
  string: StringEditor,
  text: TextEditor,
  slug: SlugEditor,
  richtext: RichtextEditor,
  number: NumberEditor,
  boolean: BooleanEditor,
  datetime: DatetimeEditor,
  image: ImageEditor,
  select: SelectEditor,
}

// Add block editor after declaration to enable recursion
editorMap.block = BlockEditor as typeof editorMap.string

export default function BlockEditor({ field, value, onChange }: Props) {
  // Ensure value is an object (not a string from old data format)
  const blockValue = (value && typeof value === 'object' && !Array.isArray(value))
    ? (value as Record<string, unknown>)
    : {}
  const blockDef = field.block

  if (!blockDef) {
    return (
      <div className="text-sm text-[#9C9C91] p-4 text-center border border-dashed border-[#E8E8E3] rounded-lg">
        No block definition provided.
      </div>
    )
  }

  const updateField = (fieldName: string, fieldValue: unknown) => {
    onChange({
      ...blockValue,
      [fieldName]: fieldValue,
    })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {blockDef.fields.map((blockField) => {
          const Editor = editorMap[blockField.type] || StringEditor

          return (
            <FormField
              key={blockField.name}
              label={getFieldLabel(blockField)}
              required={blockField.required}
            >
              <Editor
                field={blockField}
                value={blockValue[blockField.name]}
                onChange={(v) => updateField(blockField.name, v)}
                formData={blockValue}
              />
            </FormField>
          )
        })}
      </div>
    </Card>
  )
}
