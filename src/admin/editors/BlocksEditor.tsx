// src/admin/editors/BlocksEditor.tsx
import { useMemo, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Layers } from 'lucide-react'
import type { BlockDefinition } from '../types'
import { getFieldLabel } from '../types'
import { describeBlockType, iconForBlock, makeBlock, moveItem, normalizeBlocks, singularize, indefinite, type BlockValue } from '../lib/blocks'
import { joinWords } from '../lib/words'
import { useFlip } from '../components/motion/useFlip'
import { pinElement } from '../components/motion/pin'
import FieldActions from '../components/ui/FieldActions'
import { useFieldControl } from '../components/ui/FieldContext'
import { Button, EmptyState, InsertDivider, TypeMenu } from '../components/ui'
import BlockRow from './BlockRow'
import RepeaterEditor from './RepeaterEditor'
import type { EditorProps } from './types'

/** "Heading, Text or Book" */
function listTypes(defs: BlockDefinition[]): string {
  return joinWords(defs.map((d) => d.label), 'or')
}

/**
 * The page builder. Renders any block schema as an accordion of BlockRows with
 * insert-between dividers, ↑/↓ and drag reordering, and an explaining empty
 * state. A field with exactly one block type is a plain numbered list instead.
 */
export default function BlocksEditor({ field, value, onChange }: EditorProps) {
  // Ids are filled in for older content; they reach the data with the first change.
  const blocks = useMemo(() => normalizeBlocks(value), [value])
  const defs = field.blocks ?? []
  const label = getFieldLabel(field)
  const noun = singularize(label).toLowerCase()
  const { labelId } = useFieldControl()

  const [openId, setOpenId] = useState<string | null>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [justInserted, setJustInserted] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)

  // FLIP animates ↑/↓ moves; the drag library animates its own drops.
  const listRef = useRef<HTMLDivElement>(null)
  const flipEnabled = useRef(true)
  useFlip(listRef, blocks.map((b) => b._id).join(','), 200, flipEnabled)

  if (defs.length === 0) {
    return (
      <p className="m-0 p-4 text-center text-[15px] text-ink-2 border-[1.5px] border-dashed border-line-strong rounded-block">
        No block types defined for this field.
      </p>
    )
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

  const move = (from: number, to: number, animate = true) => {
    if (to < 0 || to >= blocks.length || from === to) return
    const moved = blocks[from]
    flipEnabled.current = animate
    setFlashId(moved._id)
    window.setTimeout(() => setFlashId((id) => (id === moved._id ? null : id)), 650)
    onChange(moveItem(blocks, from, to))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    move(result.source.index, result.destination.index, false)
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

  const menuHeading = (at: number) => {
    if (at === 0) return `Insert a ${noun} at the top`
    const previous = blocks[at - 1]
    return `Insert a ${noun} after “${defFor(previous._type)?.label ?? previous._type}”`
  }

  const insertPoint = (at: number) => (
    <div key={`insert-${at}`}>
      <InsertDivider label={`Insert ${indefinite(noun)} here`} active={insertAt === at} onClick={() => setInsertAt(insertAt === at ? null : at)} />
      {insertAt === at && (
        <div className="flex justify-center -mt-1 mb-2">
          <TypeMenu
            heading={menuHeading(at)}
            options={menuOptions}
            onSelect={(type) => insert(type, at)}
            onClose={() => setInsertAt(null)}
          />
        </div>
      )}
    </div>
  )

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
    <div ref={listRef} role="group" aria-labelledby={labelId} className="flex flex-col">
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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`blocks-${field.name}`}>
          {(droppable) => (
            <div ref={droppable.innerRef} {...droppable.droppableProps}>
              {blocks.map((block, i) => {
                const def = defFor(block._type)
                if (!def) return null
                return (
                  <Draggable key={block._id} draggableId={block._id} index={i}>
                    {(draggable, snapshot) => (
                      <div ref={draggable.innerRef} {...draggable.draggableProps}>
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
                          dragHandleProps={draggable.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                        {insertPoint(i + 1)}
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {droppable.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
