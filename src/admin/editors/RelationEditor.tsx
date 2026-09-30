// src/admin/editors/RelationEditor.tsx
import { useEffect, useState } from 'react'
import { FileText, Plus, TriangleAlert, X } from 'lucide-react'
import Modal, { ModalBody, ModalFooter } from '../components/Modal'
import ContentPicker, { itemLabel } from '../components/ContentPicker'
import { Button } from '../components/ui'
import { useFieldControl } from '../components/ui/FieldContext'
import { api } from '../lib/api'
import MoveButtons from './MoveButtons'
import type { EditorProps } from './types'

/** One related item: a ref ("schema:id") and the label it had when chosen. */
export interface RelationItem {
  ref: string
  label?: string
}

function asItems(value: unknown): RelationItem[] {
  return Array.isArray(value) ? value.filter((v): v is RelationItem => !!v && typeof v === 'object' && typeof v.ref === 'string') : []
}

/**
 * The current label of every ref, looked up from the collections they point
 * into, so a renamed item shows its new name and a deleted one says so.
 * `null` means the item no longer exists; a ref not yet in the map is loading.
 */
function useCurrentLabels(refs: string[]): Map<string, string | null> {
  const [labels, setLabels] = useState(new Map<string, string | null>())
  const collections = [...new Set(refs.map((r) => r.split(':')[0]))].sort().join(',')

  useEffect(() => {
    if (!collections) return
    let cancelled = false
    api
      .getSchemas()
      .then(async (res) => {
        const next = new Map<string, string | null>()
        for (const name of collections.split(',')) {
          const schema = res.data.find((s) => s.name === name)
          const items = schema ? (await api.getContent<{ id: string; [key: string]: unknown }>(name)).data : []
          for (const item of items) next.set(`${name}:${item.id}`, itemLabel(item, schema))
        }
        if (!cancelled) setLabels(next)
      })
      .catch(() => {}) // Fall back to the stored labels.
    return () => {
      cancelled = true
    }
  }, [collections])

  const result = new Map<string, string | null>()
  if (labels.size) for (const ref of refs) result.set(ref, labels.get(ref) ?? null)
  return result
}

export default function RelationEditor({ field, value, onChange }: EditorProps) {
  const { id } = useFieldControl()
  const items = asItems(value)
  const current = useCurrentLabels(items.map((i) => i.ref))
  const [draft, setDraft] = useState<RelationItem[] | null>(null)

  const commit = (next: RelationItem[]) => onChange(next.length ? next : null)

  const move = (index: number, delta: -1 | 1) => {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + delta, 0, moved)
    commit(next)
  }

  const toggle = (ref: string, label: string) =>
    setDraft((d) => (d?.some((i) => i.ref === ref) ? d.filter((i) => i.ref !== ref) : [...(d ?? []), { ref, label }]))

  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 && (
        <ul className="m-0 p-0 list-none flex flex-col gap-2">
          {items.map((item, index) => {
            const label = current.get(item.ref)
            const missing = current.has(item.ref) && label === null
            return (
              <li key={item.ref} className="control flex items-center gap-2.5 pl-3 pr-1.5 py-1.5">
                {missing ? (
                  <TriangleAlert className="w-[17px] h-[17px] text-danger-text shrink-0" aria-hidden />
                ) : (
                  <FileText className="w-[17px] h-[17px] text-ink-2 shrink-0" aria-hidden />
                )}
                <span className="flex-1 min-w-0 truncate text-[16px] text-ink">
                  {label || item.label || item.ref}
                  {missing && <span className="text-danger-text"> (deleted)</span>}
                </span>
                <MoveButtons index={index} total={items.length} onMove={(delta) => move(index, delta)} />
                <Button variant="icon" size="sm" aria-label={`Remove ${label || item.label || item.ref}`} onClick={() => commit(items.filter((_, i) => i !== index))}>
                  <X aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div>
        <Button id={id} variant="secondary" icon={<Plus aria-hidden />} onClick={() => setDraft(items)}>
          {items.length ? 'Add or remove...' : 'Choose items...'}
        </Button>
      </div>

      {draft && (
        <Modal title="Choose items" onClose={() => setDraft(null)} maxWidth="xl">
          <ModalBody className="flex flex-col gap-4">
            <ContentPicker collections={field.collections} selected={draft.map((i) => i.ref)} onToggle={toggle} />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                commit(draft)
                setDraft(null)
              }}
            >
              Done
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
