// src/server/routes/schemas.ts
import { Hono } from 'hono'
import type { BlockDefinition, FieldDefinition, PublicBlock, PublicField, PublicSchema, SchemaDefinition } from '../../lib/schema'

/**
 * The definitions as the admin sees them. A block may contain itself (a list
 * of articles inside an article); the second visit is sent without fields so
 * the mapping ends and the admin still knows the block's name and label.
 */
function mapField(f: FieldDefinition, seen: ReadonlySet<string>): PublicField {
  return {
    name: f.name,
    type: f.type,
    label: f.label,
    required: f.required,
    default: f.default,
    placeholder: f.placeholder,
    options: f.options,
    from: f.from,
    blocks: f.blocks?.map((b) => mapBlock(b, seen)),
    block: f.block ? mapBlock(f.block, seen) : undefined,
    collections: f.collections,
    kinds: f.kinds,
    toolbar: f.toolbar,
  }
}

function mapBlock(b: BlockDefinition, seen: ReadonlySet<string>): PublicBlock {
  const base = { name: b.name, label: b.label, icon: b.icon, description: b.description }
  if (seen.has(b.name)) return { ...base, fields: [] }
  const inner = new Set(seen).add(b.name)
  return { ...base, fields: b.fields.map((f) => mapField(f, inner)) }
}

export function createSchemasRoute(schemas: SchemaDefinition[]) {
  const app = new Hono()

  // GET /schemas - List all schemas (public, for introspection)
  app.get('/schemas', (c) => {
    const publicSchemas: PublicSchema[] = schemas
      .filter((s): s is SchemaDefinition & { type: 'singleton' | 'collection' } => s.type !== 'block')
      .map((s) => ({
        name: s.name,
        label: s.label,
        type: s.type,
        labelField: s.labelField,
        fields: s.fields.map((f) => mapField(f, new Set())),
      }))
    return c.json({ data: publicSchemas, siteName: process.env.SITE_NAME || 'EggCMS' })
  })

  return app
}
