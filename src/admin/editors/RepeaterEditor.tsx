// src/admin/editors/RepeaterEditor.tsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { BlockDefinition } from '../types'
import { indefinite, makeBlock, type BlockValue } from '../lib/blocks'
import Collapse from '../components/motion/Collapse'
import FieldList from '../components/FieldList'
import { Button } from '../components/ui'

interface RepeaterEditorProps {
  def: BlockDefinition
  items: BlockValue[]
  onChange: (items: BlockValue[]) => void
}

/**
 * A list of items that are all the same shape: numbered down the left, each
 * one an open card with its own fields and a Remove, and a dashed slate button
 * to add another at the end. Used for every single-type blocks field, inside a
 * block or at the top level.
 */
export default function RepeaterEditor({ def, items, onChange }: RepeaterEditorProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const noun = def.label.toLowerCase()

  const add = () => {
    const block = makeBlock(def)
    setJustAdded(block._id)
    onChange([...items, block])
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <Collapse key={item._id} open={removingId !== item._id} appear={justAdded === item._id} onClosed={() => onChange(items.filter((x) => x._id !== item._id))}>
          <div data-testid="repeater-item" className="flex gap-2.5 items-stretch">
            <div className="w-[30px] shrink-0 flex flex-col items-center pt-3.5 gap-1.5">
              <span className="font-mono text-[13px] text-ink-2">{i + 1}</span>
              <div className="flex-1 w-[2px] bg-line-hair rounded" aria-hidden />
            </div>
            <div className="flex-1 min-w-0 border-[1.5px] border-line-strong rounded-block bg-stripe overflow-hidden">
              <FieldList
                fields={def.fields}
                data={item}
                onChange={(next) => onChange(items.map((x) => (x._id === item._id ? { ...x, ...next, _type: x._type, _id: x._id } : x)))}
                labelWidth={100}
                className="!gap-0 [&>[data-testid=field-card]]:border-0 [&>[data-testid=field-card]]:rounded-none [&>[data-testid=field-card]]:bg-transparent [&>[data-field=tall]]:px-3 [&>[data-field=tall]]:py-3"
              />
              <div className="flex justify-end px-3 pb-3">
                <Button variant="destructive" size="sm" icon={<Trash2 aria-hidden />} onClick={() => setRemovingId(item._id)} className="!border-line-strong" aria-label={`Remove this ${noun}`}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </Collapse>
      ))}
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
