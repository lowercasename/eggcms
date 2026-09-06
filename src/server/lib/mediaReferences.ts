// src/server/lib/mediaReferences.ts
import { sqlite } from '../db'
import type { SchemaDefinition } from '../../lib/schema'

export interface MediaReference {
  schema: string
  id: string
  label: string
}

/**
 * Every content item that mentions a media path anywhere in its fields: an
 * image or file field, an <img> or link inside rich text, or a block that
 * holds one of those. A substring match is enough because a stored path is
 * always the tail of whatever public URL the content carries.
 */
export function findMediaReferences(schemas: SchemaDefinition[], mediaPath: string): MediaReference[] {
  const found: MediaReference[] = []

  for (const schema of schemas) {
    if (schema.type === 'block' || schema.fields.length === 0) continue

    const where = schema.fields.map((f) => `"${f.name}" LIKE ?`).join(' OR ')
    const params = schema.fields.map(() => `%${mediaPath}%`)

    let rows: Record<string, unknown>[]
    try {
      rows = sqlite.prepare(`SELECT * FROM "${schema.name}" WHERE ${where}`).all(...params) as Record<string, unknown>[]
    } catch {
      // A schema whose table has not been created yet cannot reference anything.
      continue
    }

    const labelField = schema.labelField ?? 'title'
    for (const row of rows) {
      const label = row[labelField]
      found.push({
        schema: schema.name,
        id: String(row.id),
        label: typeof label === 'string' && label.trim() ? label : schema.label,
      })
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
