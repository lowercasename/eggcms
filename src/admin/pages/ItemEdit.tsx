// src/admin/pages/ItemEdit.tsx
import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'wouter'
import { api } from '../lib/api'
import type { Schema, FieldDefinition } from '../types'
import { getFieldLabel } from '../types'
import { Heading, Alert, FormField, Button } from '../components/ui'
import { Loader2, Trash2, CircleDot } from 'lucide-react'
import { useDirtyState } from '../hooks/useDirtyState'
import { useDirtyStateContext } from '../contexts/DirtyStateContext'
import StringEditor from '../editors/StringEditor'
import TextEditor from '../editors/TextEditor'
import NumberEditor from '../editors/NumberEditor'
import BooleanEditor from '../editors/BooleanEditor'
import RichtextEditor from '../editors/RichtextEditor'
import DatetimeEditor from '../editors/DatetimeEditor'
import SelectEditor from '../editors/SelectEditor'
import SlugEditor from '../editors/SlugEditor'
import ImageEditor from '../editors/ImageEditor'
import BlocksEditor from '../editors/BlocksEditor'
import BlockEditor from '../editors/BlockEditor'

interface ItemEditProps {
  schema: Schema
  itemId: string
  refreshList: () => void
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
  blocks: BlocksEditor,
  block: BlockEditor,
}

export default function ItemEdit({ schema, itemId, refreshList }: ItemEditProps) {
  const [, navigate] = useLocation()

  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isNew = itemId === 'new'

  // Only track user-editable fields for dirty state (exclude server metadata)
  const editableData = useMemo(() => {
    const { _meta, ...fields } = data
    return fields
  }, [data])
  const { isDirty, markClean } = useDirtyState(editableData, loading, itemId)
  const { setDirty } = useDirtyStateContext()

  // Sync dirty state with global context for navigation guards
  useEffect(() => {
    setDirty(isDirty)
    return () => setDirty(false) // Clear on unmount
  }, [isDirty, setDirty])

  // Helper to get draft status from _meta (API response) - new items are always drafts
  const isDraft = isNew ? true : (data._meta as { draft?: boolean } | undefined)?.draft

  useEffect(() => {
    if (isNew) {
      // Set field defaults only - no _meta needed for new items
      const defaults: Record<string, unknown> = {}
      for (const field of schema.fields) {
        if (field.default !== undefined) {
          defaults[field.name] = field.default
        }
      }
      setData(defaults)
      setLoading(false)
      return
    }

    setLoading(true)
    api.getItem(schema.name, itemId)
      .then((res) => setData(res.data as Record<string, unknown>))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [itemId, schema.name, schema.fields, isNew])

  const handleSave = async (asDraft = true) => {
    setSaving(true)
    setError('')

    try {
      // Send draft at top level (backend expects it there), exclude _meta from payload
      const { _meta, ...fields } = data
      const saveData = { ...fields, draft: asDraft ? 1 : 0 }

      if (isNew) {
        const result = await api.createItem(schema.name, saveData)
        const newItem = result.data as { id: string }
        markClean()
        refreshList()
        navigate(`/collections/${schema.name}/${newItem.id}`, { replace: true })
      } else {
        const result = await api.updateItem(schema.name, itemId, saveData)
        setData(result.data as Record<string, unknown>)
        markClean()
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
      await api.deleteItem(schema.name, itemId)
      markClean() // Clear dirty state before navigation
      refreshList()
      navigate(`/collections/${schema.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-[#9C9C91]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Heading>
                {isNew ? `New ${schema.label.replace(/s$/, '')}` : `Edit ${schema.label.replace(/s$/, '')}`}
              </Heading>
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-[#FEF8EC] text-[#B8862B]">
                  <CircleDot className="w-3 h-3" />
                  Unsaved
                </span>
              )}
              {!isNew && !isDirty && (
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                  ${isDraft
                    ? 'bg-[#FEF8EC] text-[#B8862B]'
                    : 'bg-[#F0F9F3] text-[#3D9A5D]'
                  }
                `}>
                  {isDraft ? 'Draft' : 'Published'}
                </span>
              )}
            </div>
            <p className="text-sm text-[#9C9C91]">
              {isNew ? 'Fill in the details below to create a new entry' : 'Make changes and save when ready'}
            </p>
          </div>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          <div className="space-y-6">
            {schema.fields.map((field) => {
              const Editor = editorMap[field.type] || StringEditor

              return (
                <FormField key={field.name} label={getFieldLabel(field)} required={field.required}>
                  <Editor
                    field={field}
                    value={data[field.name]}
                    onChange={(v) => setData({ ...data, [field.name]: v })}
                    formData={data}
                  />
                </FormField>
              )
            })}
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="flex-shrink-0 px-8 py-4 border-t border-[#E8E8E3] bg-white flex items-center gap-3">
        <Button onClick={() => handleSave(false)} loading={saving}>
          {isNew ? 'Publish' : isDraft ? 'Save & Publish' : 'Save'}
        </Button>
        <Button variant="secondary" onClick={() => handleSave(true)} disabled={saving}>
          {isNew ? 'Save as Draft' : isDraft ? 'Save Draft' : 'Revert to Draft'}
        </Button>
        {!isNew && (
          <Button variant="ghost" onClick={handleDelete} className="ml-auto text-[#DC4E42] hover:bg-[#FEF2F1]">
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
