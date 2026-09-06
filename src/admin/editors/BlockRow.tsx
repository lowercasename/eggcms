// src/admin/editors/BlockRow.tsx
import { useRef } from 'react'
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { GripVertical, ArrowUp, ArrowDown, ChevronDown, Trash2 } from 'lucide-react'
import type { BlockDefinition } from '../types'
import { getBlockPreview, getBlockThumbnail, iconForBlock, type BlockValue } from '../lib/blocks'
import { SectionProvider } from '../contexts/SectionContext'
import Collapse from '../components/motion/Collapse'
import FieldList from '../components/FieldList'
import { Button } from '../components/ui'

export interface BlockRowProps {
  block: BlockValue
  def: BlockDefinition
  index: number
  total: number
  /** Lower-case singular of the field label: "section". */
  noun: string
  open: boolean
  onToggle: (headerEl: HTMLElement) => void
  onMove: (delta: -1 | 1) => void
  onChange: (next: BlockValue) => void
  confirming: boolean
  onAskRemove: () => void
  onCancelRemove: () => void
  onRemove: () => void
  /** The row is animating out; once it has, `onRemoved` fires. */
  removing: boolean
  onRemoved: () => void
  /** Grow in on mount (just inserted). */
  appear: boolean
  /** Brief slate outline after being moved. */
  flash: boolean
  /** From the drag-and-drop library: goes on the grip handle. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
}

/**
 * One block in a blocks field: a 52px header that toggles it open, ↑/↓ to
 * reorder, the block's own fields when open, and an inline confirm to remove.
 * Everything here is generic; the header preview, thumbnail and icon come
 * from rules in lib/blocks, never from the block's type.
 */
export default function BlockRow(props: BlockRowProps) {
  const { block, def, index, total, noun, open, confirming, removing, appear, flash, isDragging } = props
  const headerRef = useRef<HTMLDivElement>(null)
  const Icon = iconForBlock(def)
  const preview = getBlockPreview(block, def)
  const thumbnail = getBlockThumbnail(block, def)
  const typeLower = def.label.toLowerCase()

  const border = isDragging ? 'border-2 border-structure shadow-menu' : open ? 'border-2 border-ink shadow-open' : 'border-[1.5px] border-line-strong'

  return (
    <Collapse open={!removing} appear={appear} onClosed={props.onRemoved}>
      <div
        data-testid="block-row"
        data-flip-key={block._id}
        className={`bg-panel rounded-block overflow-hidden transition-[box-shadow] duration-150 ${border} ${flash ? 'animate-outline-flash' : ''}`}
      >
        <div
          ref={headerRef}
          onClick={() => headerRef.current && props.onToggle(headerRef.current)}
          className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[52px] cursor-pointer ${open ? 'bg-page border-b border-line-strong' : ''}`}
        >
          {/* Only the handle is draggable: a draggable row would swallow the
              mouse-downs that place the caret in the block's rich text. */}
          <button
            type="button"
            aria-label="Drag to move"
            title="Drag to move"
            onClick={(e) => e.stopPropagation()}
            {...props.dragHandleProps}
            className="shrink-0 flex items-center justify-center w-[30px] h-[34px] -ml-1.5 rounded-[6px] cursor-grab active:cursor-grabbing text-ink-3 hover:bg-line-hair/60 hover:text-ink-nav"
          >
            <GripVertical className="w-[18px] h-[18px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation()
              headerRef.current && props.onToggle(headerRef.current)
            }}
            className="flex-1 min-w-0 flex items-center gap-3 text-left focus-visible:outline-offset-2 rounded-[4px]"
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                role="presentation"
                className={`w-[30px] h-[30px] shrink-0 rounded-tile object-cover border ${open ? 'border-structure ring-1 ring-structure' : 'border-structure-border'}`}
              />
            ) : (
              <span
                className={`w-[30px] h-[30px] shrink-0 rounded-tile border flex items-center justify-center transition-colors ${
                  open ? 'bg-structure border-structure text-white' : 'bg-structure-tint border-structure-border text-structure'
                }`}
                aria-hidden
              >
                <Icon className="w-[17px] h-[17px]" />
              </span>
            )}
            <span className="text-[15px] font-bold text-ink shrink-0">{def.label}</span>
            <span className="flex-1 min-w-0 text-[15px] text-ink-2 truncate">{preview}</span>
            {open && (
              <span className="text-[13px] text-ink-2 shrink-0">
                {index + 1} of {total}
              </span>
            )}
          </button>
          <Button
            variant="icon"
            size="sm"
            aria-label="Move up"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation()
              props.onMove(-1)
            }}
            className="disabled:opacity-40 disabled:bg-panel disabled:border-line-strong"
          >
            <ArrowUp aria-hidden />
          </Button>
          <Button
            variant="icon"
            size="sm"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation()
              props.onMove(1)
            }}
            className="disabled:opacity-40 disabled:bg-panel disabled:border-line-strong"
          >
            <ArrowDown aria-hidden />
          </Button>
          <ChevronDown className={`w-5 h-5 text-ink-nav shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden />
        </div>

        <Collapse open={open}>
          <SectionProvider value={{ typeLabel: def.label, index, total }}>
            <div className="pt-1.5 pb-3.5">
              <FieldList
                fields={def.fields}
                data={block}
                onChange={(next) => props.onChange({ ...block, ...next, _type: block._type, _id: block._id })}
                labelWidth={140}
                className="!gap-0 [&>[data-testid=field-card]]:border-0 [&>[data-testid=field-card]]:rounded-none [&>[data-field=tall]]:px-4 [&>[data-field=tall]]:py-3.5"
              />
              <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-4 mt-2 border-t border-line-hair">
                {confirming ? (
                  <>
                    <span className="text-[14px] text-ink-2">
                      Remove this {typeLower} {noun}?
                    </span>
                    <Button variant="secondary" size="sm" onClick={props.onCancelRemove}>
                      Keep it
                    </Button>
                    <Button variant="destructive-solid" size="sm" onClick={props.onRemove}>
                      Yes, remove
                    </Button>
                  </>
                ) : (
                  <Button variant="destructive" size="sm" icon={<Trash2 aria-hidden />} onClick={props.onAskRemove} className="!border-line-strong">
                    Remove {noun}
                  </Button>
                )}
              </div>
            </div>
          </SectionProvider>
        </Collapse>
      </div>
    </Collapse>
  )
}
