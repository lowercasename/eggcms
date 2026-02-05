// src/admin/pages/Singleton.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Schema, FieldDefinition } from '../types'

// Import editors
import StringEditor from '../editors/StringEditor'
import TextEditor from '../editors/TextEditor'
import NumberEditor from '../editors/NumberEditor'
import BooleanEditor from '../editors/BooleanEditor'
import RichtextEditor from '../editors/RichtextEditor'
import DatetimeEditor from '../editors/DatetimeEditor'
import SelectEditor from '../editors/SelectEditor'
import SlugEditor from '../editors/SlugEditor'
import ImageEditor from '../editors/ImageEditor'

interface SingletonProps {
  schemas: Schema[]
}

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
  blocks: TextEditor,
}

export default function Singleton({ schemas }: SingletonProps) {
  const { schema: schemaName } = useParams<{ schema: string }>()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const schema = schemas.find((s) => s.name === schemaName && s.type === 'singleton')

  useEffect(() => {
    if (!schema) return

    setLoading(true)
    api.getSingleton(schema.name)
      .then((res) => {
        setData((res.data as Record<string, unknown>) || {})
      })
      .catch(() => {
        // Singleton might not exist yet, start with empty data
        setData({})
      })
      .finally(() => setLoading(false))
  }, [schema?.name])

  const handleSave = async () => {
    if (!schema) return

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await api.updateSingleton(schema.name, data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!schema) {
    return <div className="p-8">Schema not found</div>
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">{schema.label}</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">Saved successfully</div>
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
                formData={data}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
