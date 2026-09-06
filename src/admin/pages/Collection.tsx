// src/admin/pages/Collection.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { AlertCircle, FileText } from 'lucide-react'
import { api } from '../lib/api'
import ItemList from '../components/ItemList'
import ItemEdit from './ItemEdit'
import { useSchemas } from '../App'
import { EmptyState } from '../components/ui'
import { entryNoun } from '../lib/words'
import type { Schema } from '../types'

// Resolve label field: explicit labelField > slug's from fields > 'title'
export function resolveLabelField(schema: Schema): string | string[] {
  if (schema.labelField) return schema.labelField
  const slugField = schema.fields.find((f) => f.type === 'slug' && f.from)
  if (slugField?.from) return slugField.from
  return 'title'
}

export default function Collection() {
  const params = useParams<{ schema: string; id?: string }>()
  const { schemas } = useSchemas()
  const [items, setItems] = useState<Array<{ id: string }>>([])
  const [loading, setLoading] = useState(true)
  const [listOpen, setListOpen] = useState(true)

  const schema = schemas.find((s) => s.name === params.schema && s.type === 'collection')

  const refreshList = () => {
    if (!schema) return
    api
      .getContent<{ id: string }>(schema.name)
      .then((res) => setItems(res.data))
      .catch(console.error)
  }

  useEffect(() => {
    if (!schema) return
    setLoading(true)
    api
      .getContent<{ id: string }>(schema.name)
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [schema?.name])

  if (!schema) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<AlertCircle />} title="This collection does not exist" description="Choose one from the list on the left." />
      </div>
    )
  }

  const labelField = resolveLabelField(schema)
  const noun = entryNoun(schema.label)

  return (
    <div className="flex-1 min-w-0 flex h-screen">
      {listOpen &&
        (loading ? (
          <div className="w-[250px] shrink-0 bg-panel border-r border-line-strong flex items-center justify-center text-[15px] text-ink-2">Loading…</div>
        ) : (
          <ItemList
            items={items}
            schemaName={schema.name}
            schemaLabel={schema.label}
            labelField={labelField}
            onHide={() => setListOpen(false)}
            creating={params.id === 'new'}
          />
        ))}
      <div className="flex-1 min-w-0 flex flex-col">
        {params.id ? (
          <ItemEdit
            key={params.id}
            schema={schema}
            itemId={params.id}
            refreshList={refreshList}
            onShowList={listOpen ? undefined : () => setListOpen(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={<FileText />}
              title={`Choose a ${noun} to edit`}
              description={`Pick one from the list, or make a new ${noun}.`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
