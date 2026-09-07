// src/admin/editors/RepeaterEditor.tsx
import { useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import type { BlockDefinition } from '../types'
import { indefinite, makeBlock, type BlockValue } from '../lib/blocks'
import Collapse from '../components/motion/Collapse'
import { useFlip } from '../components/motion/useFlip'
import FieldList from '../components/FieldList'
import { Button } from '../components/ui'

interface RepeaterEditorProps {
  def: BlockDefinition
  items: BlockValue[]
  onChange: (items: BlockValue[]) => void
}

/**
 * A list of items that are all the same shape: numbered down the left with a
 * drag handle, each one an open card with its own fields, ↑/↓ and a Remove,
 * and a dashed slate button to add another at the end. Used for every single-type blocks field, inside a
 * block or at the top level.
 */
export default function RepeaterEditor({ def, items, onChange }: RepeaterEditorProps) {
  const [removing, setRemoving] = useState<Set<string>>(new Set())
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const noun = def.label.toLowerCase()
  const listRef = useRef<HTMLDivElement>(null)
  const flipEnabled = useRef(true)
  useFlip(listRef, items.map((i) => i._id).join(','), 200, flipEnabled)

  const move = (from: number, to: number, animate = true) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    flipEnabled.current = animate
    onChange(next)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    move(result.source.index, result.destination.index, false)
  }

  const add = () => {
    const block = makeBlock(def)
    setJustAdded(block._id)
    onChange([...items, block])
  }

  return (
    <div ref={listRef} className="flex flex-col gap-2">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={`repeater-${def.name}`}>
          {(droppable) => (
            <div ref={droppable.innerRef} {...droppable.droppableProps} className="flex flex-col gap-2">
              {items.map((item, i) => (
                <Draggable key={item._id} draggableId={item._id} index={i}>
                  {(draggable, snapshot) => (
                    <div ref={draggable.innerRef} {...draggable.draggableProps}>
                      <Collapse
                        open={!removing.has(item._id)}
                        appear={justAdded === item._id}
                        onClosed={() => onChange(items.filter((x) => x._id !== item._id))}
                      >
                        <div data-testid="repeater-item" data-flip-key={item._id} className="flex gap-2.5 items-stretch">
                          <div className="w-[30px] shrink-0 flex flex-col items-center pt-2 gap-1.5">
                            <button
                              type="button"
                              aria-label="Drag to move"
                              title="Drag to move"
                              {...draggable.dragHandleProps}
                              className="w-[30px] h-[30px] flex items-center justify-center rounded-[6px] cursor-grab active:cursor-grabbing text-ink-3 hover:bg-line-hair/60 hover:text-ink-nav"
                            >
                              <GripVertical className="w-[18px] h-[18px]" aria-hidden />
                            </button>
                            <span className="font-mono text-[13px] text-ink-2">{i + 1}</span>
                            <div className="flex-1 w-[2px] bg-line-hair rounded" aria-hidden />
                          </div>
                          <div
                            className={`flex-1 min-w-0 rounded-block bg-stripe overflow-hidden ${snapshot.isDragging ? 'border-2 border-structure shadow-menu' : 'border-[1.5px] border-line-strong'}`}
                          >
                            <FieldList
                              fields={def.fields}
                              data={item}
                              onChange={(next) =>
                                onChange(items.map((x) => (x._id === item._id ? { ...x, ...next, _type: x._type, _id: x._id } : x)))
                              }
                              labelWidth={100}
                              className="!gap-0 [&>[data-testid=field-card]]:border-0 [&>[data-testid=field-card]]:rounded-none [&>[data-testid=field-card]]:bg-transparent [&>[data-field=tall]]:px-3 [&>[data-field=tall]]:py-3"
                            />
                            <div className="flex items-center justify-end gap-2 px-3 pb-3">
                              <Button
                                variant="icon"
                                size="sm"
                                aria-label="Move up"
                                disabled={i === 0}
                                onClick={() => move(i, i - 1)}
                                className="disabled:opacity-40 disabled:bg-panel disabled:border-line-strong"
                              >
                                <ArrowUp aria-hidden />
                              </Button>
                              <Button
                                variant="icon"
                                size="sm"
                                aria-label="Move down"
                                disabled={i === items.length - 1}
                                onClick={() => move(i, i + 1)}
                                className="disabled:opacity-40 disabled:bg-panel disabled:border-line-strong"
                              >
                                <ArrowDown aria-hidden />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                icon={<Trash2 aria-hidden />}
                                onClick={() => setRemoving((prev) => new Set(prev).add(item._id))}
                                className="!border-line-strong ml-2"
                                aria-label={`Remove this ${noun}`}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  )}
                </Draggable>
              ))}
              {droppable.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div className="flex gap-2.5">
        <div className="w-[30px] shrink-0" aria-hidden />
        <button
          type="button"
          onClick={add}
          className="flex-1 flex items-center justify-center gap-2 py-[11px] border-[1.5px] border-dashed border-structure rounded-block bg-panel text-structure text-[15px] font-bold hover:bg-structure-tint transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden />
          Add {indefinite(noun)} to this list
        </button>
      </div>
    </div>
  )
}
