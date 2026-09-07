// src/admin/lib/blocks.ts
// Generic rules for the blocks field: how a block is previewed, iconed,
// described and created. Nothing here knows any particular block type.
import { icons, Layers, AlignLeft, Heading2, Image, Paperclip, Link, Square, type LucideIcon } from 'lucide-react'
import type { BlockDefinition, FieldDefinition } from '../types'
import { getFieldLabel } from '../types'
import { singularize } from './words'

export interface BlockValue {
  _type: string
  _id: string
  [key: string]: unknown
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

/** A fresh block of this type, carrying only the fields that have defaults. */
export function makeBlock(def: BlockDefinition): BlockValue {
  const block: BlockValue = { _type: def.name, _id: generateId() }
  for (const f of def.fields) {
    if (f.default !== undefined) block[f.name] = f.default
  }
  return block
}

const TEXT_TYPES = new Set(['string', 'text', 'slug', 'select'])

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export { singularize, indefinite } from './words'

function pluralize(label: string, n: number): string {
  const lower = label.toLowerCase()
  if (n === 1) return singularize(lower)
  return /s$/i.test(lower) ? lower : `${lower}s`
}

/**
 * One line that says what a block holds, from the first non-empty text-like
 * field in schema order. A nested list is summarised by count and first title.
 */
export function getBlockPreview(block: BlockValue, def: BlockDefinition): string {
  for (const f of def.fields) {
    const value = block[f.name]
    if (TEXT_TYPES.has(f.type) && typeof value === 'string' && value.trim()) return value.trim()
    if (f.type === 'richtext' && typeof value === 'string') {
      const text = stripHtml(value)
      if (text) return text
    }
    if (f.type === 'blocks' && Array.isArray(value) && value.length > 0) {
      const items = value as BlockValue[]
      const inner = f.blocks ?? []
      const noun = pluralize(inner.length === 1 ? inner[0].label : 'item', items.length)
      const titles = items
        .map((item) => {
          const itemDef = inner.find((d) => d.name === item._type)
          return itemDef ? getBlockPreview(item, itemDef) : ''
        })
        .filter((t) => t && t !== '(empty)')
      return titles.length ? `${items.length} ${noun} · ${titles[0]}` : `${items.length} ${noun}, none titled yet`
    }
  }
  return '(empty)'
}

/** The first image field with a value, to show as the row's thumbnail. */
export function getBlockThumbnail(block: BlockValue, def: BlockDefinition): string | null {
  for (const f of def.fields) {
    const value = block[f.name]
    if (f.type === 'image' && typeof value === 'string' && value.trim()) return value
  }
  return null
}

/** The schema's description, or the field labels joined: "Title, Cover and Details". */
export function describeBlockType(def: BlockDefinition): string {
  if (def.description) return def.description
  const labels = def.fields.map((f) => getFieldLabel(f))
  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}

/** A Lucide icon by its kebab-case name, e.g. "book-open". */
export function iconByName(name: string | undefined): LucideIcon | null {
  if (!name) return null
  const pascal = name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return (icons as Record<string, LucideIcon>)[pascal] ?? null
}

/** The schema's icon, or a guess by priority: a nested list, then an image, a file, prose, a link, then a heading if every field is text. */
export function iconForBlock(def: BlockDefinition): LucideIcon {
  const named = iconByName(def.icon)
  if (named) return named
  const types = def.fields.map((f: FieldDefinition) => f.type)
  if (types.includes('blocks')) return Layers
  if (types.includes('image')) return Image
  if (types.includes('file')) return Paperclip
  if (types.includes('richtext') || types.includes('text')) return AlignLeft
  if (types.includes('link')) return Link
  if (types.length > 0 && types.every((t) => t === 'string' || t === 'slug')) return Heading2
  return Square
}
