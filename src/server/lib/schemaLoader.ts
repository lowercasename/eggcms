// src/server/lib/schemaLoader.ts
import { existsSync } from 'fs'
import type { SchemaDefinition } from '../../lib/schema'
import compiledSchemas from '../../schemas'

const VALID_SCHEMA_TYPES = ['collection', 'singleton', 'block']
const DEFAULT_SCHEMAS_PATH = '/app/schemas.js'

function validateSchema(schema: unknown, index: number): schema is SchemaDefinition {
  if (!schema || typeof schema !== 'object') {
    throw new Error(`Invalid schema at index ${index}: must be an object`)
  }

  const s = schema as Record<string, unknown>

  if (!s.name || typeof s.name !== 'string') {
    throw new Error(`Invalid schema at index ${index}: missing or invalid 'name'`)
  }

  if (!s.label || typeof s.label !== 'string') {
    throw new Error(`Invalid schema at index ${index} (${s.name}): missing or invalid 'label'`)
  }

  if (!s.type || typeof s.type !== 'string') {
    throw new Error(`Invalid schema at index ${index} (${s.name}): missing or invalid 'type'`)
  }

  if (!VALID_SCHEMA_TYPES.includes(s.type)) {
    throw new Error(
      `Invalid schema type '${s.type}' for schema '${s.name}'. Must be one of: ${VALID_SCHEMA_TYPES.join(', ')}`
    )
  }

  if (!Array.isArray(s.fields)) {
    throw new Error(`Invalid schema at index ${index} (${s.name}): 'fields' must be an array`)
  }

  return true
}

export function validateSchemas(schemas: unknown): SchemaDefinition[] {
  if (!Array.isArray(schemas)) {
    throw new Error('Schemas must be exported as a default array')
  }

  for (let i = 0; i < schemas.length; i++) {
    validateSchema(schemas[i], i)
  }

  return schemas as SchemaDefinition[]
}

// Resolve block references from string names to actual block definitions
export function resolveBlockReferences(schemas: SchemaDefinition[]): SchemaDefinition[] {
  // Build a map of block definitions by name
  const blockMap = new Map<string, SchemaDefinition>()
  for (const schema of schemas) {
    if (schema.type === 'block') {
      blockMap.set(schema.name, schema)
    }
  }

  // Resolve references in fields
  for (const schema of schemas) {
    for (const field of schema.fields) {
      // Resolve blocks array (e.g., blocks: ['heroBlock', 'textBlock'])
      if (field.type === 'blocks' && Array.isArray(field.blocks)) {
        field.blocks = field.blocks.map((b: unknown) => {
          if (typeof b === 'string') {
            const blockDef = blockMap.get(b)
            if (!blockDef) {
              throw new Error(`Block '${b}' referenced in field '${field.name}' of schema '${schema.name}' not found`)
            }
            return blockDef
          }
          return b // Already a block definition object
        })
      }

      // Resolve single block reference (e.g., block: 'imageBlock')
      if (field.type === 'block' && typeof field.block === 'string') {
        const blockDef = blockMap.get(field.block)
        if (!blockDef) {
          throw new Error(`Block '${field.block}' referenced in field '${field.name}' of schema '${schema.name}' not found`)
        }
        field.block = blockDef
      }
    }
  }

  return schemas
}

export async function loadSchemas(): Promise<SchemaDefinition[]> {
  const schemasPath = process.env.SCHEMAS_PATH || DEFAULT_SCHEMAS_PATH

  if (!existsSync(schemasPath)) {
    return compiledSchemas
  }

  try {
    const externalModule = await import(schemasPath)
    const schemas = externalModule.default

    const validated = validateSchemas(schemas)
    return resolveBlockReferences(validated)
  } catch (error) {
    // Log error but fall back to compiled schemas
    console.error(`Failed to load external schemas from ${schemasPath}:`, error)
    console.error('Falling back to compiled schemas')
    return compiledSchemas
  }
}
