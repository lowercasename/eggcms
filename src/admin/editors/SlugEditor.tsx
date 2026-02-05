// src/admin/editors/SlugEditor.tsx
import type { FieldDefinition } from '../types'

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
      const sourceValue = formData[field.from]
      if (typeof sourceValue === 'string') {
        onChange(slugify(sourceValue))
      }
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {field.from && (
        <button
          type="button"
          onClick={handleGenerate}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Generate
        </button>
      )}
    </div>
  )
}
