// src/admin/editors/SlugEditor.tsx
import type { FieldDefinition } from '../types'
import { Input, Button } from '../components/ui'

interface Props {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
  formData?: Record<string, unknown>  // To access the source field
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function SlugEditor({ field, value, onChange, formData }: Props) {
  const handleGenerate = () => {
    if (field.from && formData) {
      const fields = Array.isArray(field.from) ? field.from : [field.from]
      const parts = fields
        .map(f => formData[f])
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
      if (parts.length > 0) {
        onChange(slugify(parts.join(' ')))
      }
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="flex-1"
      />
      {field.from && (
        <Button variant="secondary" onClick={handleGenerate}>
          Generate
        </Button>
      )}
    </div>
  )
}
