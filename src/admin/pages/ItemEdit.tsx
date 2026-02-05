// src/admin/pages/ItemEdit.tsx
import { useState, useEffect } from 'react'
import { useParams, useOutletContext, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Schema } from '../types'

// Placeholder editors until we create real ones
function StringEditor({ field, value, onChange }: { field: { name: string; placeholder?: string }; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <input
      type="text"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

function TextEditor({ field, value, onChange }: { field: { name: string; placeholder?: string }; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={5}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

function NumberEditor({ field, value, onChange }: { field: { name: string; placeholder?: string }; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <input
      type="number"
      value={(value as number) ?? ''}
      onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder={field.placeholder}
      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

function BooleanEditor({ value, onChange }: { field: { name: string }; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          value ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  )
}

interface FieldDefinition {
  name: string
  type: string
  required?: boolean
  default?: unknown
  placeholder?: string
}

interface OutletContext {
  schema: Schema & { fields: FieldDefinition[] }
  refreshList: () => void
}

const editorMap: Record<string, React.ComponentType<{ field: FieldDefinition; value: unknown; onChange: (v: unknown) => void }>> = {
  string: StringEditor,
  text: TextEditor,
  slug: StringEditor,
  richtext: TextEditor, // Placeholder until we add Tiptap
  number: NumberEditor,
  boolean: BooleanEditor,
  datetime: StringEditor, // Placeholder
  image: StringEditor, // Placeholder
  select: StringEditor, // Placeholder
  blocks: TextEditor, // Placeholder
}

export default function ItemEdit() {
  const { id } = useParams<{ id: string }>()
  const { schema, refreshList } = useOutletContext<OutletContext>()
  const navigate = useNavigate()

  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      // Set defaults
      const defaults: Record<string, unknown> = { draft: 1 }
      for (const field of schema.fields) {
        if (field.default !== undefined) {
          defaults[field.name] = field.default
        }
      }
      setData(defaults)
      setLoading(false)
      return
    }

    api.getItem(schema.name, id!)
      .then((res) => setData(res.data as Record<string, unknown>))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, schema.name, schema.fields, isNew])

  const handleSave = async (asDraft = true) => {
    setSaving(true)
    setError('')

    try {
      const saveData = { ...data, draft: asDraft ? 1 : 0 }

      if (isNew) {
        const result = await api.createItem(schema.name, saveData)
        const newId = (result.data as { id: string }).id
        refreshList()
        navigate(`/collections/${schema.name}/${newId}`, { replace: true })
      } else {
        await api.updateItem(schema.name, id!, saveData)
        refreshList()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.deleteItem(schema.name, id!)
      refreshList()
      navigate(`/collections/${schema.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">
        {isNew ? `New ${schema.label.replace(/s$/, '')}` : `Edit ${schema.label.replace(/s$/, '')}`}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      <div className="space-y-6">
        {schema.fields.map((field) => {
          const Editor = editorMap[field.type] || StringEditor

          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Editor
                field={field}
                value={data[field.name]}
                onChange={(v) => setData({ ...data, [field.name]: v })}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Publish
        </button>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
