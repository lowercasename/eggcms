// src/admin/editors/BlocksEditor.tsx
import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import type { FieldDefinition } from '../types'
import { getFieldLabel } from '../types'
import { Button, Select, FormField, Card } from '../components/ui'
import { GripVertical, Trash2, LayoutGrid, Plus, ChevronDown, ChevronRight } from 'lucide-react'

// Import all editors for rendering block fields
import StringEditor from './StringEditor'
import TextEditor from './TextEditor'
import NumberEditor from './NumberEditor'
import BooleanEditor from './BooleanEditor'
import RichtextEditor from './RichtextEditor'
import DatetimeEditor from './DatetimeEditor'
import SelectEditor from './SelectEditor'
import SlugEditor from './SlugEditor'
import ImageEditor from './ImageEditor'
import BlockEditor from './BlockEditor'
import LinkFieldEditor from './LinkFieldEditor'

interface BlockDefinition {
  name: string
  label: string
  fields: FieldDefinition[]
}

interface Block {
  _type: string
  _id: string
  [key: string]: unknown
}

interface Props {
  field: FieldDefinition & { blocks?: BlockDefinition[] }
  value: unknown
  onChange: (v: unknown) => void
}

// Editor map with self-reference for nested blocks
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
  link: LinkFieldEditor,
}

// Add blocks and block editors after declaration to enable recursion
editorMap.blocks = BlocksEditor as typeof editorMap.string
editorMap.block = BlockEditor as typeof editorMap.string

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export default function BlocksEditor({ field, value, onChange }: Props) {
  const [selectedBlockType, setSelectedBlockType] = useState('')
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
  const blocks = (value as Block[]) || []
  const blockDefinitions = field.blocks || []

  const toggleCollapse = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  const getBlockPreview = (block: Block, blockDef: BlockDefinition): string => {
    // Try to get a preview from the first string-like field
    for (const f of blockDef.fields) {
      if ((f.type === 'string' || f.type === 'text') && block[f.name]) {
        const val = String(block[f.name])
        return val.length > 50 ? val.slice(0, 50) + '...' : val
      }
    }
    return ''
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(blocks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onChange(items)
  }

  const addBlockByType = (typeName: string) => {
    const blockDef = blockDefinitions.find((b) => b.name === typeName)
    if (!blockDef) return

    const newBlock: Block = {
      _type: typeName,
      _id: generateId(),
    }

    // Initialize with defaults
    for (const f of blockDef.fields) {
      if (f.default !== undefined) {
        newBlock[f.name] = f.default
      }
    }

    onChange([...blocks, newBlock])
    setSelectedBlockType('')
    // Auto-expand the newly added block
    setExpandedBlocks((prev) => new Set(prev).add(newBlock._id))
  }

  const updateBlock = (index: number, fieldName: string, fieldValue: unknown) => {
    const updated = blocks.map((block, i) =>
      i === index ? { ...block, [fieldName]: fieldValue } : block
    )
    onChange(updated)
  }

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
  }

  const getBlockDefinition = (typeName: string) =>
    blockDefinitions.find((b) => b.name === typeName)

  if (blockDefinitions.length === 0) {
    return (
      <div className="text-sm text-[#9C9C91] p-4 text-center border border-dashed border-[#E8E8E3] rounded-lg">
        No block types defined for this field.
      </div>
    )
  }

  const blockOptions = blockDefinitions.map((b) => ({
    value: b.name,
    label: b.label,
  }))

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {blocks.map((block, index) => {
                const blockDef = getBlockDefinition(block._type)
                if (!blockDef) return null

                const isCollapsed = !expandedBlocks.has(block._id)
                const preview = isCollapsed ? getBlockPreview(block, blockDef) : ''

                return (
                  <Draggable key={block._id} draggableId={block._id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-[#E5644E]' : ''}`}
                      >
                        <div className={`flex items-center gap-3 ${isCollapsed ? '' : 'mb-4 pb-3 border-b border-[#E8E8E3]'}`}>
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab text-[#9C9C91] hover:text-[#6B6B63] transition-colors"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <button
                            onClick={() => toggleCollapse(block._id)}
                            className="p-1 rounded-md text-[#9C9C91] hover:text-[#6B6B63] hover:bg-[#F5F5F3] transition-colors"
                            title={isCollapsed ? 'Expand' : 'Collapse'}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span className="font-medium text-sm text-[#1A1A18] flex-1">
                            {blockDef.label}
                            {preview && (
                              <span className="font-normal text-[#9C9C91] ml-2">
                                — {preview}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => removeBlock(index)}
                            className="p-1.5 rounded-md text-[#9C9C91] hover:text-[#DC4E42] hover:bg-[#FEF2F1] transition-colors"
                            title="Remove block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className="space-y-4">
                            {blockDef.fields.map((blockField) => {
                              const Editor = editorMap[blockField.type] || StringEditor

                              return (
                                <FormField
                                  key={blockField.name}
                                  label={getFieldLabel(blockField)}
                                  required={blockField.required}
                                >
                                  <Editor
                                    field={blockField}
                                    value={block[blockField.name]}
                                    onChange={(v) => updateBlock(index, blockField.name, v)}
                                    formData={block}
                                  />
                                </FormField>
                              )
                            })}
                          </div>
                        )}
                      </Card>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {blocks.length === 0 && (
        <div className="py-8 text-center border-2 border-dashed border-[#E8E8E3] rounded-lg">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#F5F5F3] flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-[#9C9C91]" />
          </div>
          <p className="text-sm text-[#9C9C91]">No blocks added yet</p>
          <p className="text-xs text-[#9C9C91] mt-1">Add your first block below</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {blockDefinitions.length === 1 ? (
          <Button
            variant="secondary"
            onClick={() => addBlockByType(blockDefinitions[0].name)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add {blockDefinitions[0].label}
          </Button>
        ) : (
          <Select
            value={selectedBlockType}
            onChange={(e) => {
              const val = e.target.value
              if (val) {
                addBlockByType(val)
              }
            }}
            options={blockOptions}
            placeholder="Select block type..."
            className="flex-1"
          />
        )}
      </div>
    </div>
  )
}
