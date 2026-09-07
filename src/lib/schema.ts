import { isMediaKind, type MediaKind } from './media'

// `_type` and `_id` are what a block carries about itself.
const RESERVED_FIELDS = ['id', 'created_at', 'updated_at', '_type', '_id', 'draft']

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaValidationError'
  }
}

export function validateSchema(schema: SchemaDefinition): void {
  const fieldNames = new Set<string>()

  for (const field of schema.fields) {
    // Check reserved names
    if (RESERVED_FIELDS.includes(field.name)) {
      throw new SchemaValidationError(`Field '${field.name}' is reserved`)
    }

    // The admin has an editor for exactly these types.
    if (!(FIELD_TYPES as readonly string[]).includes(field.type)) {
      throw new SchemaValidationError(`Field '${field.name}' has unknown type '${field.type}'. Use one of: ${FIELD_TYPES.join(', ')}`)
    }

    if (field.type === 'richtext' && field.toolbar !== undefined && !TOOLBARS.includes(field.toolbar)) {
      throw new SchemaValidationError(`Richtext field '${field.name}' has unknown toolbar '${field.toolbar}'. Use one of: ${TOOLBARS.join(', ')}`)
    }

    for (const kind of field.kinds ?? []) {
      if (!isMediaKind(kind)) {
        throw new SchemaValidationError(`File field '${field.name}' has unknown kind '${kind}'`)
      }
    }

    // Check duplicates
    if (fieldNames.has(field.name)) {
      throw new SchemaValidationError(`Field '${field.name}' defined twice in schema '${schema.name}'`)
    }
    fieldNames.add(field.name)

    // Validate slug has 'from' field
    if (field.type === 'slug' && !field.from) {
      throw new SchemaValidationError(`Slug field '${field.name}' requires 'from' option`)
    }

    // Validate select has options
    if (field.type === 'select' && (!field.options || field.options.length === 0)) {
      throw new SchemaValidationError(`Select field '${field.name}' requires 'options'`)
    }

    // Validate blocks has block definitions
    if (field.type === 'blocks' && (!field.blocks || field.blocks.length === 0)) {
      throw new SchemaValidationError(`Blocks field '${field.name}' requires 'blocks' array`)
    }

    // Validate block (singular) has a block definition
    if (field.type === 'block' && !field.block) {
      throw new SchemaValidationError(`Block field '${field.name}' requires 'block' definition`)
    }
  }
}

/** Every field type the admin can edit, in one place; validateSchema enforces it. */
export const FIELD_TYPES = [
  'string',
  'text',
  'richtext',
  'number',
  'boolean',
  'datetime',
  'image',
  'slug',
  'select',
  'blocks',
  'block',
  'link',
  'file',
] as const
export type FieldType = (typeof FIELD_TYPES)[number]

export const TOOLBARS = ['full', 'minimal'] as const
export type RichtextToolbar = (typeof TOOLBARS)[number]

export interface FieldDefinition {
  name: string
  type: FieldType
  label?: string
  required?: boolean
  default?: unknown
  placeholder?: string
  options?: string[]
  from?: string | string[]
  blocks?: BlockDefinition[]
  block?: BlockDefinition  // For single block field
  collections?: string[]  // For link fields - restrict to specific collections
  kinds?: MediaKind[]  // For file fields - which media kinds may be attached (default: document)
  toolbar?: RichtextToolbar  // For richtext fields - 'minimal' shows only bold, italic and link
}

/**
 * Convert camelCase or PascalCase to "Sentence case"
 * e.g., "siteTitle" -> "Site title", "firstName" -> "First name"
 */
export function fieldNameToLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')  // Add space before capitals
    .replace(/^./, (s) => s.toUpperCase())  // Capitalize first letter
    .trim()
    .toLowerCase()
    .replace(/^./, (s) => s.toUpperCase())  // Capitalize first letter again after lowercase
}

/**
 * Get the display label for a field (custom label or derived from name)
 */
export function getFieldLabel(field: { name: string; label?: string }): string {
  return field.label || fieldNameToLabel(field.name)
}

export interface SchemaDefinition {
  name: string
  label: string
  type: 'singleton' | 'collection' | 'block'
  fields: FieldDefinition[]
  drafts?: boolean
  labelField?: string  // Field to use as display label in lists (defaults to 'title')
}

export type BlockDefinition = SchemaDefinition & {
  type: 'block'
  icon?: string  // A Lucide icon name (e.g. 'book-open') shown on the block's row and in the insert menu
  description?: string  // One sentence shown when choosing a block type
}
export type SingletonDefinition = SchemaDefinition & { type: 'singleton' }
export type CollectionDefinition = SchemaDefinition & { type: 'collection' }

export function defineSingleton(config: Omit<SingletonDefinition, 'type'>): SingletonDefinition {
  return { ...config, type: 'singleton' }
}

export function defineCollection(config: Omit<CollectionDefinition, 'type' | 'drafts'> & { drafts?: boolean; labelField?: string }): CollectionDefinition {
  return { ...config, type: 'collection', drafts: config.drafts ?? true }
}

export function defineBlock(config: Omit<BlockDefinition, 'type'>): BlockDefinition {
  return { ...config, type: 'block' }
}

// Field helpers
export const f = {
  string: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'string', ...opts }),
  text: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'text', ...opts }),
  richtext: (name: string, opts?: { toolbar?: RichtextToolbar } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'richtext', ...opts }),
  number: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'number', ...opts }),
  boolean: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'boolean', ...opts }),
  datetime: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'datetime', ...opts }),
  image: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'image', ...opts }),
  slug: (name: string, opts: { from: string | string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'slug', ...opts }),
  select: (name: string, opts: { options: string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'select', ...opts }),
  blocks: (name: string, opts: { blocks: BlockDefinition[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'blocks', ...opts }),
  block: (name: string, opts: { block: BlockDefinition } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'block', ...opts }),
  link: (name: string, opts?: { collections?: string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'link', ...opts }),
  file: (name: string, opts?: { kinds?: MediaKind[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'file', ...opts }),
}

/*
 * The wire shape GET /api/schemas sends to the admin: the definitions above
 * without anything the server keeps to itself (drafts, block-level type).
 * The route maps into these types and the admin reads from them, so a new
 * property is added here once and the compiler points at the mapping.
 */
export interface PublicBlock {
  name: string
  label: string
  icon?: string
  description?: string
  fields: PublicField[]
}

export interface PublicField {
  name: string
  type: FieldType
  label?: string
  required?: boolean
  default?: unknown
  placeholder?: string
  options?: string[]
  from?: string | string[]
  blocks?: PublicBlock[]
  block?: PublicBlock
  collections?: string[]
  kinds?: MediaKind[]
  toolbar?: RichtextToolbar
}

export interface PublicSchema {
  name: string
  label: string
  type: 'singleton' | 'collection'
  labelField?: string
  fields: PublicField[]
}
