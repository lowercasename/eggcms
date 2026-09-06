// src/admin/editors/BlocksEditor.tsx
import { useRef, useState, type DragEvent } from 'react'
import { Layers } from 'lucide-react'
import type { BlockDefinition } from '../types'
import { getFieldLabel } from '../types'
import { describeBlockType, iconForBlock, makeBlock, singularize, type BlockValue } from '../lib/blocks'
import { useFlip } from '../components/motion/useFlip'
import { pinElement } from '../components/motion/pin'
import FieldActions from '../components/ui/FieldActions'
import { Button, EmptyState, InsertDivider, TypeMenu } from '../components/ui'
import BlockRow from './BlockRow'
import RepeaterEditor from './RepeaterEditor'
import type { EditorProps } from './types'

/** "Heading, Text or Book" */
function listTypes(defs: BlockDefinition[]): string {
  const labels = defs.map((d) => d.label)
  if (labels.length <= 1) return labels.join('')
  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`
}

/**
 * The page builder. Renders any block schema as an accordion of BlockRows with
 * insert-between dividers, ↑/↓ and drag reordering, and an explaining empty
 * state. A field with exactly one block type is a plain numbered list instead.
 */
export default function BlocksEditor({ field, value, onChange }: EditorProps) {
  const blocks = (Array.isArray(value) ? value : []) as BlockValue[]
  const defs = field.blocks ?? []
  const label = getFieldLabel(field)
  const noun = singularize(label).toLowerCase()

  const [openId, setOpenId] = useState<string | null>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [justInserted, setJustInserted] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  useFlip(listRef, blocks.map((b) => b._id).join(','))

  if (defs.length === 0) {
    return <p className="m-0 p-4 text-center text-[15px] text-ink-2 border-[1.5px] border-dashed border-line-strong rounded-block">No block types defined for this field.</p>
  }

  if (defs.length === 1) {
    return <RepeaterEditor def={defs[0]} items={blocks} onChange={(items) => onChange(items)} />
  }

  const defFor = (type: string) => defs.find((d) => d.name === type)

  const toggle = (block: BlockValue, header: HTMLElement) => {
    const opening = openId !== block._id
    const openIndex = blocks.findIndex((b) => b._id === openId)
    const thisIndex = blocks.findIndex((b) => b._id === block._id)
    // A block above is about to close: keep the clicked header under the pointer.
    if (opening && openIndex !== -1 && openIndex < thisIndex) pinElement(header)
    setOpenId(opening ? block._id : null)
    setConfirmId(null)
    setInsertAt(null)
  }

  const insert = (type: string, at: number) => {
    const def = defFor(type)
    if (!def) return
    const block = makeBlock(def)
    const next = [...blocks]
    next.splice(at, 0, block)
    setJustInserted(block._id)
    setOpenId(block._id)
    setInsertAt(null)
    onChange(next)
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setFlashId(moved._id)
    window.setTimeout(() => setFlashId((id) => (id === moved._id ? null : id)), 650)
    onChange(next)
  }

  const commitRemove = (id: string) => {
    setRemovingId(null)
    setConfirmId(null)
    if (openId === id) setOpenId(null)
    onChange(blocks.filter((b) => b._id !== id))
  }

  const menuOptions = defs.map((d) => {
    const Icon = iconForBlock(d)
    return { value: d.name, label: d.label, description: describeBlockType(d), icon: <Icon aria-hidden /> }
  })

  const menuHeading = (at: number) =>
    at === 0 ? `Insert ${noun === 'section' ? 'a' : 'a'} ${noun} at the top` : `Insert a ${noun} after “${defFor(blocks[at - 1]._type)?.label ?? blocks[at - 1]._type}”`

  const insertPoint = (at: number) => (
    <div key={`insert-${at}`}>
      <InsertDivider label={`Insert a ${noun} here`} active={insertAt === at} onClick={() => setInsertAt(insertAt === at ? null : at)} />
      {insertAt === at && (
        <div className="flex justify-center -mt-1 mb-2">
          <TypeMenu heading={menuHeading(at)} options={menuOptions} onSelect={(type) => insert(type, at)} onClose={() => setInsertAt(null)} />
        </div>
      )}
    </div>
  )

  const dragStart = (block: BlockValue) => (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', block._id)
    } catch {
      /* jsdom */
    }
    setDragId(block._id)
    setOpenId(null)
    setInsertAt(null)
  }
  const dragOver = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (overIndex !== index) setOverIndex(index)
  }
  const drop = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const from = blocks.findIndex((b) => b._id === dragId)
    if (from >= 0) move(from, index)
    setDragId(null)
    setOverIndex(null)
  }
  const dragEnd = () => {
    setDragId(null)
    setOverIndex(null)
  }

  if (blocks.length === 0) {
    return (
      <EmptyState
        dashed="structure"
        icon={<Layers />}
        title={`No ${label.toLowerCase()} yet`}
        description={`${label} are the pieces this is built from: ${listTypes(defs)}. Add them in any order and move them around later.`}
        action={defs.map((d) => {
          const Icon = iconForBlock(d)
          return (
            <Button key={d.name} variant="structure" icon={<Icon aria-hidden />} onClick={() => insert(d.name, 0)}>
              Add {d.label.toLowerCase()}
            </Button>
          )
        })}
      />
    )
  }

  return (
    <div ref={listRef} className="flex flex-col">
      <FieldActions>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setOpenId(null)
            setInsertAt(null)
          }}
        >
          Collapse all
        </Button>
      </FieldActions>

      {insertPoint(0)}
      {blocks.map((block, i) => {
        const def = defFor(block._type)
        if (!def) return null
        return (
          <div key={block._id}>
            <BlockRow
              block={block}
              def={def}
              index={i}
              total={blocks.length}
              noun={noun}
              open={openId === block._id}
              onToggle={(header) => toggle(block, header)}
              onMove={(delta) => move(i, i + delta)}
              onChange={(next) => onChange(blocks.map((b) => (b._id === block._id ? next : b)))}
              confirming={confirmId === block._id}
              onAskRemove={() => setConfirmId(block._id)}
              onCancelRemove={() => setConfirmId(null)}
              onRemove={() => setRemovingId(block._id)}
              removing={removingId === block._id}
              onRemoved={() => commitRemove(block._id)}
              appear={justInserted === block._id}
              flash={flashId === block._id}
              dragging={dragId === block._id}
              dropTarget={overIndex === i && dragId !== null && dragId !== block._id}
              onDragStart={dragStart(block)}
              onDragOver={dragOver(i)}
              onDrop={drop(i)}
              onDragEnd={dragEnd}
            />
            {insertPoint(i + 1)}
          </div>
        )
      })}
    </div>
  )
}
