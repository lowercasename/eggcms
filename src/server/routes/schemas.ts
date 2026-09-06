// src/server/routes/schemas.ts
import { Hono } from 'hono'
import type { SchemaDefinition } from '../../lib/schema'

export function createSchemasRoute(schemas: SchemaDefinition[]) {
  const app = new Hono()

  // GET /schemas - List all schemas (public, for introspection)
  app.get('/schemas', (c) => {
    const mapField = (f: typeof schemas[0]['fields'][0]): Record<string, unknown> => ({
      name: f.name,
      type: f.type,
      label: f.label,
      required: f.required,
      default: f.default,
      placeholder: f.placeholder,
      options: f.options,
      from: f.from,
      // Include block definitions for blocks fields (array)
      blocks: f.blocks?.map(mapBlock),
      // Include block definition for single block field
      block: f.block ? mapBlock(f.block) : undefined,
      // Include collections restriction for link fields
      collections: f.collections,
      // Include accepted media kinds for file fields
      kinds: f.kinds,
      // Include toolbar option for richtext fields
      toolbar: f.toolbar,
    })

    const mapBlock = (b: NonNullable<typeof schemas[0]['fields'][0]['blocks']>[0]) => ({
      name: b.name,
      label: b.label,
      icon: b.icon,
      description: b.description,
      fields: b.fields.map(mapField),
    })

    const publicSchemas = schemas
      .filter((s) => s.type !== 'block')
      .map((s) => ({
        name: s.name,
        label: s.label,
        type: s.type,
        labelField: s.labelField,
        fields: s.fields.map(mapField),
      }))
    return c.json({ data: publicSchemas, siteName: process.env.SITE_NAME || 'EggCMS' })
  })

  return app
}
