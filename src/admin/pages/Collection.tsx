// src/admin/pages/Collection.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { AlertCircle, FileText, PanelLeftOpen } from 'lucide-react'
import { api } from '../lib/api'
import ItemList from '../components/ItemList'
import ItemEdit from './ItemEdit'
import { useSchemas } from '../App'
import { Button, EmptyState, NoticeBar } from '../components/ui'
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
  const [listError, setListError] = useState('')
  const [listOpen, setListOpen] = useState(true)

  const schema = schemas.find((s) => s.name === params.schema && s.type === 'collection')

  const refreshList = () => {
    if (!schema) return
    api
      .getContent<{ id: string }>(schema.name)
      .then((res) => {
        setItems(res.data)
        setListError('')
      })
      .catch((err) => setListError(err instanceof Error ? err.message : 'Request failed'))
  }

  useEffect(() => {
    if (!schema) return
    setLoading(true)
    setListError('')
    api
      .getContent<{ id: string }>(schema.name)
      .then((res) => setItems(res.data))
      .catch((err) => setListError(err instanceof Error ? err.message : 'Request failed'))
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
      {/* The list slides between its full width and a narrow rail that reopens it. */}
      <div
        className="shrink-0 overflow-hidden transition-[width] duration-[250ms] ease-[var(--ease-move)]"
        style={{ width: listOpen ? 250 : 48 }}
      >
        {listOpen ? (
          loading ? (
            <div className="w-[250px] h-screen bg-panel border-r border-line-strong flex items-center justify-center text-[15px] text-ink-2">Loading…</div>
          ) : listError ? (
            <div className="w-[250px] h-screen bg-panel border-r border-line-strong flex flex-col">
              <NoticeBar variant="error" className="!px-3.5 flex-wrap" actions={<Button variant="secondary" size="sm" onClick={refreshList}>Try again</Button>}>
                <b>The list could not be loaded.</b> {listError}
              </NoticeBar>
            </div>
          ) : (
            <ItemList
              items={items}
              schemaName={schema.name}
              schemaLabel={schema.label}
              labelField={labelField}
              onHide={() => setListOpen(false)}
              creating={params.id === 'new'}
            />
          )
        ) : (
          <div className="w-12 h-screen bg-panel border-r border-line-strong flex flex-col items-center pt-3.5 animate-fade-in">
            <Button variant="icon" size="sm" aria-label="Show the list" title={`Show the ${schema.label.toLowerCase()} list`} onClick={() => setListOpen(true)}>
              <PanelLeftOpen aria-hidden />
            </Button>
            <span className="mt-4 text-[13px] font-semibold text-ink-2 [writing-mode:vertical-rl] rotate-180" aria-hidden>
              {schema.label}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        {params.id ? (
          <ItemEdit key={params.id} schema={schema} itemId={params.id} refreshList={refreshList} />
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
