// src/admin/editors/BlockRow.tsx
import { useRef, type DragEvent } from 'react'
import { GripVertical, ArrowUp, ArrowDown, ChevronDown, Trash2 } from 'lucide-react'
import type { BlockDefinition } from '../types'
import { getBlockPreview, iconForBlock, type BlockValue } from '../lib/blocks'
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
  dragging: boolean
  dropTarget: boolean
  onDragStart: (e: DragEvent<HTMLDivElement>) => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}

/**
 * One block in a blocks field: a 52px header that toggles it open, ↑/↓ to
 * reorder, the block's own fields when open, and an inline confirm to remove.
 * Everything here is generic; the header preview and icon come from rules in
 * lib/blocks, never from the block's type.
 */
export default function BlockRow(props: BlockRowProps) {
  const { block, def, index, total, noun, open, confirming, removing, appear, flash, dragging, dropTarget } = props
  const headerRef = useRef<HTMLDivElement>(null)
  const Icon = iconForBlock(def)
  const preview = getBlockPreview(block, def)
  const typeLower = def.label.toLowerCase()

  const border = dropTarget
    ? 'border-[2.5px] border-dashed border-structure'
    : open
      ? 'border-2 border-ink shadow-open'
      : 'border-[1.5px] border-line-strong'

  return (
    <Collapse open={!removing} appear={appear} onClosed={props.onRemoved}>
      <div
        data-testid="block-row"
        data-flip-key={block._id}
        data-drop-target={dropTarget || undefined}
        draggable
        onDragStart={props.onDragStart}
        onDragOver={props.onDragOver}
        onDrop={props.onDrop}
        onDragEnd={props.onDragEnd}
        className={`bg-panel rounded-block overflow-hidden transition-[opacity,box-shadow] duration-150 ${border} ${dragging ? 'opacity-60' : ''} ${flash ? 'animate-outline-flash' : ''}`}
      >
        <div
          ref={headerRef}
          onClick={() => headerRef.current && props.onToggle(headerRef.current)}
          className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[52px] cursor-pointer ${open ? 'bg-page border-b border-line-strong' : ''}`}
        >
          <GripVertical className="w-[18px] h-[18px] text-ink-3 shrink-0 cursor-grab" aria-hidden />
          <button
            type="button"
            aria-expanded={open}
            onClick={(e) => {
              e.stopPropagation()
              headerRef.current && props.onToggle(headerRef.current)
            }}
            className="flex-1 min-w-0 flex items-center gap-3 text-left focus-visible:outline-offset-2 rounded-[4px]"
          >
            <span
              className={`w-[30px] h-[30px] shrink-0 rounded-tile border flex items-center justify-center transition-colors ${
                open ? 'bg-structure border-structure text-white' : 'bg-structure-tint border-structure-border text-structure'
              }`}
              aria-hidden
            >
              <Icon className="w-[17px] h-[17px]" />
            </span>
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
          <ChevronDown
            className={`w-5 h-5 text-ink-nav shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
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
