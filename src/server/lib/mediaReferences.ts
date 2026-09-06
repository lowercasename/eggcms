// src/server/lib/mediaReferences.ts
import { sqlite } from '../db'
import type { SchemaDefinition } from '../../lib/schema'

export interface MediaReference {
  schema: string
  schemaLabel: string
  id: string
  label: string
}

/** The label a content row is known by: its label field, or the schema's label. */
function rowLabel(schema: SchemaDefinition, row: Record<string, unknown>): string {
  const labelField = schema.labelField ?? 'title'
  const label = row[labelField]
  return typeof label === 'string' && label.trim() ? label : schema.label
}

/**
 * Every content item that mentions a media path anywhere in its fields: an
 * image or file field, an <img> or link inside rich text, or a block that
 * holds one of those. A substring match is enough because a stored path is
 * always the tail of whatever public URL the content carries.
 */
export function findMediaReferences(schemas: SchemaDefinition[], mediaPath: string): MediaReference[] {
  return findAllMediaReferences(schemas, [mediaPath]).get(mediaPath) ?? []
}

/**
 * The same, for a whole library at once: each content table is read a single
 * time and every row is checked against every path.
 */
export function findAllMediaReferences(schemas: SchemaDefinition[], mediaPaths: string[]): Map<string, MediaReference[]> {
  const found = new Map<string, MediaReference[]>(mediaPaths.map((p) => [p, []]))
  if (mediaPaths.length === 0) return found

  for (const schema of schemas) {
    if (schema.type === 'block' || schema.fields.length === 0) continue

    let rows: Record<string, unknown>[]
    try {
      rows = sqlite.prepare(`SELECT * FROM "${schema.name}"`).all() as Record<string, unknown>[]
    } catch {
      // A schema whose table has not been created yet cannot reference anything.
      continue
    }

    for (const row of rows) {
      const haystack = schema.fields
        .map((f) => row[f.name])
        .filter((v): v is string => typeof v === 'string')
        .join('\n')
      if (!haystack) continue

      for (const path of mediaPaths) {
        if (!haystack.includes(path)) continue
        found.get(path)!.push({
          schema: schema.name,
          schemaLabel: schema.label,
          id: String(row.id),
          label: rowLabel(schema, row),
        })
      }
    }
  }

  return found
}

/** "Australia (page)" or "Australia (page) and 2 others". */
export function describeReferences(refs: MediaReference[]): string {
  if (refs.length === 0) return ''
  const first = `${refs[0].label} (${refs[0].schema})`
  if (refs.length === 1) return first
  const rest = refs.length - 1
  return `${first} and ${rest} other${rest === 1 ? '' : 's'}`
}
