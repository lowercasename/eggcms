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
      blocks: f.blocks?.map((b) => ({
        name: b.name,
        label: b.label,
        fields: b.fields.map(mapField),
      })),
      // Include block definition for single block field
      block: f.block ? {
        name: f.block.name,
        label: f.block.label,
        fields: f.block.fields.map(mapField),
      } : undefined,
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
