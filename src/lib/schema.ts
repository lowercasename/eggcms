const RESERVED_FIELDS = ['id', 'created_at', 'updated_at', '_type', 'draft']

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

export type FieldType =
  | 'string'
  | 'text'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'datetime'
  | 'image'
  | 'slug'
  | 'select'
  | 'blocks'
  | 'block'
  | 'link'

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
export function getFieldLabel(field: FieldDefinition): string {
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

export type BlockDefinition = SchemaDefinition & { type: 'block' }
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
  richtext: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'richtext', ...opts }),
  number: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'number', ...opts }),
  boolean: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'boolean', ...opts }),
  datetime: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'datetime', ...opts }),
  image: (name: string, opts?: Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'image', ...opts }),
  slug: (name: string, opts: { from: string | string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'slug', ...opts }),
  select: (name: string, opts: { options: string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'select', ...opts }),
  blocks: (name: string, opts: { blocks: BlockDefinition[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'blocks', ...opts }),
  block: (name: string, opts: { block: BlockDefinition } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'block', ...opts }),
  link: (name: string, opts?: { collections?: string[] } & Partial<FieldDefinition>): FieldDefinition => ({ name, type: 'link', ...opts }),
}
