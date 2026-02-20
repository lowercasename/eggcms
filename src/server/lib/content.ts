// src/server/lib/content.ts
import { randomUUID } from 'crypto'
import { sqlite } from '../db'
import { toPublicUrl, transformHtmlImageUrls } from './url'
import type { SchemaDefinition, FieldDefinition } from '../../lib/schema'

type SQLBindValue = string | number | boolean | null | bigint

// Fields that store JSON data
const JSON_FIELD_TYPES = ['blocks', 'block', 'link']

function toSqlValue(value: unknown, field: FieldDefinition): SQLBindValue {
  if (value === null || value === undefined) return null
  if (JSON_FIELD_TYPES.includes(field.type)) {
    return JSON.stringify(value)
  }
  return value as SQLBindValue
}

function fromSqlValue(value: unknown, field: FieldDefinition): unknown {
  if (value === null || value === undefined) return null
  if (JSON_FIELD_TYPES.includes(field.type) && typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  // Convert boolean fields from SQLite integer (0/1) to boolean
  if (field.type === 'boolean') {
    return Boolean(value)
  }
  // Apply PUBLIC_URL to image fields
  if (field.type === 'image' && typeof value === 'string') {
    return toPublicUrl(value)
  }
  // Transform image URLs in richtext HTML
  if (field.type === 'richtext' && typeof value === 'string') {
    return transformHtmlImageUrls(value)
  }
  return value
}

function deserializeRow(row: Record<string, unknown>, schema: SchemaDefinition): Record<string, unknown> {
  if (!row) return row

  // Start with id at top level
  const result: Record<string, unknown> = { id: row.id }

  // Add schema fields
  for (const field of schema.fields) {
    if (field.name in row) {
      result[field.name] = fromSqlValue(row[field.name], field)
    }
  }

  // Add meta fields
  result._meta = {
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(schema.type === 'collection' && { draft: Boolean(row.draft) }),
  }

  return result
}

export function getSchema(schemas: SchemaDefinition[], name: string): SchemaDefinition | undefined {
  return schemas.find((s) => s.name === name && s.type !== 'block')
}

export function listItems(schema: SchemaDefinition, includeDrafts: boolean): unknown[] {
  const draftClause = schema.type === 'collection' && !includeDrafts ? 'WHERE draft = 0' : ''
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" ${draftClause} ORDER BY created_at DESC`)
  const rows = stmt.all() as Record<string, unknown>[]
  return rows.map((row) => deserializeRow(row, schema))
}

export function getItem(schema: SchemaDefinition, id: string): unknown {
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" WHERE id = ?`)
  const row = stmt.get(id) as Record<string, unknown> | undefined
  return row ? deserializeRow(row, schema) : undefined
}

export function getSingleton(schema: SchemaDefinition): unknown {
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" LIMIT 1`)
  const row = stmt.get() as Record<string, unknown> | undefined
  return row ? deserializeRow(row, schema) : undefined
}

export function createItem(schema: SchemaDefinition, data: Record<string, unknown>): unknown {
  const id = randomUUID()
  const now = new Date().toISOString()
  const values: SQLBindValue[] = [id]
  const placeholders: string[] = ['?']
  const columns: string[] = ['"id"']

  for (const field of schema.fields) {
    columns.push(`"${field.name}"`)
    placeholders.push('?')
    values.push(toSqlValue(data[field.name], field))
  }

  if (schema.type === 'collection') {
    columns.push('"draft"')
    placeholders.push('?')
    values.push((data.draft as SQLBindValue) ?? 1)
  }

  columns.push('"created_at"', '"updated_at"')
  placeholders.push('?', '?')
  values.push(now, now)

  const sql = `INSERT INTO "${schema.name}" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
  sqlite.prepare(sql).run(...(values as [SQLBindValue, ...SQLBindValue[]]))

  return getItem(schema, id)
}

export function updateItem(schema: SchemaDefinition, id: string, data: Record<string, unknown>): unknown {
  const now = new Date().toISOString()
  const sets: string[] = []
  const values: SQLBindValue[] = []

  for (const field of schema.fields) {
    if (field.name in data) {
      sets.push(`"${field.name}" = ?`)
      values.push(toSqlValue(data[field.name], field))
    }
  }

  if (schema.type === 'collection' && 'draft' in data) {
    sets.push('"draft" = ?')
    values.push(data.draft as SQLBindValue)
  }

  sets.push('"updated_at" = ?')
  values.push(now)
  values.push(id)

  const sql = `UPDATE "${schema.name}" SET ${sets.join(', ')} WHERE id = ?`
  sqlite.prepare(sql).run(...(values as [SQLBindValue, ...SQLBindValue[]]))

  return getItem(schema, id)
}

export function deleteItem(schema: SchemaDefinition, id: string): boolean {
  const result = sqlite.prepare(`DELETE FROM "${schema.name}" WHERE id = ?`).run(id)
  return result.changes > 0
}

export function upsertSingleton(schema: SchemaDefinition, data: Record<string, unknown>): unknown {
  const existing = getSingleton(schema)
  if (existing) {
    return updateItem(schema, (existing as { id: string }).id, data)
  } else {
    return createItem(schema, data)
  }
}
