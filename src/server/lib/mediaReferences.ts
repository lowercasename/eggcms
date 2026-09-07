// src/server/lib/mediaReferences.ts
import { sqlite } from '../db'
import type { SchemaDefinition } from '../../lib/schema'
import type { MediaReference } from '../../lib/media'

export type { MediaReference }

/** The label a content row is known by: its label field, or the schema's label. */
function rowLabel(schema: SchemaDefinition, row: Record<string, unknown>): string {
  const labelField = schema.labelField ?? 'title'
  const label = row[labelField]
  return typeof label === 'string' && label.trim() ? label : schema.label
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * A path counts as used only where it ends: at the end of the text, or before
 * a quote, bracket, space, `?` or `#`. So `/uploads/thesis.doc` is not "used"
 * by a page that links to `/uploads/thesis.docx`.
 */
function matcherFor(path: string): RegExp {
  return new RegExp(`${escapeRegExp(path)}(?=$|["'\\s)\\]}>?#,])`)
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
 *
 * Only a missing table is tolerated (a schema whose content has never been
 * created cannot reference anything). Any other database error is thrown, so
 * a delete never proceeds on a check that silently failed.
 */
export function findAllMediaReferences(schemas: SchemaDefinition[], mediaPaths: string[]): Map<string, MediaReference[]> {
  const paths = Array.from(new Set(mediaPaths))
  const found = new Map<string, MediaReference[]>(paths.map((p) => [p, []]))
  if (paths.length === 0) return found
  const matchers = paths.map((path) => ({ path, re: matcherFor(path) }))

  for (const schema of schemas) {
    if (schema.type === 'block' || schema.fields.length === 0) continue

    let rows: Record<string, unknown>[]
    try {
      rows = sqlite.prepare(`SELECT * FROM "${schema.name.replace(/"/g, '""')}"`).all() as Record<string, unknown>[]
    } catch (err) {
      if (err instanceof Error && /no such table/i.test(err.message)) continue
      throw err
    }

    for (const row of rows) {
      const haystack = schema.fields
        .map((f) => row[f.name])
        .filter((v): v is string => typeof v === 'string')
        .join('\n')
      if (!haystack) continue

      for (const { path, re } of matchers) {
        if (!re.test(haystack)) continue
        found.get(path)!.push({
          schema: schema.name,
          schemaLabel: schema.label,
          schemaType: schema.type === 'singleton' ? 'singleton' : 'collection',
          id: String(row.id),
          label: rowLabel(schema, row),
        })
      }
    }
  }

  return found
}

/** "Pages" → "page", for prose. */
function nounFor(schemaLabel: string): string {
  const lower = schemaLabel.toLowerCase()
  return /s$/.test(lower) && !/ss$/.test(lower) ? lower.slice(0, -1) : lower
}

/** "the page “Australia”", "Site Settings", or "the page “Australia” and 2 others". */
export function describeReferences(refs: MediaReference[]): string {
  if (refs.length === 0) return ''
  const first = refs[0]
  const head = first.schemaType === 'singleton' ? first.label : `the ${nounFor(first.schemaLabel)} “${first.label}”`
  if (refs.length === 1) return head
  const rest = refs.length - 1
  return `${head} and ${rest} other${rest === 1 ? '' : 's'}`
}
