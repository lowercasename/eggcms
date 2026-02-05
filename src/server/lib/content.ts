// src/server/lib/content.ts
import { randomUUID } from 'crypto'
import { sqlite } from '../db'
import type { SchemaDefinition } from '../../lib/schema'

type SQLBindValue = string | number | boolean | null | bigint

export function getSchema(schemas: SchemaDefinition[], name: string): SchemaDefinition | undefined {
  return schemas.find((s) => s.name === name && s.type !== 'block')
}

export function listItems(schema: SchemaDefinition, includeDrafts: boolean): unknown[] {
  const draftClause = schema.type === 'collection' && !includeDrafts ? 'WHERE draft = 0' : ''
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" ${draftClause} ORDER BY created_at DESC`)
  return stmt.all()
}

export function getItem(schema: SchemaDefinition, id: string): unknown {
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" WHERE id = ?`)
  return stmt.get(id)
}

export function getSingleton(schema: SchemaDefinition): unknown {
  const stmt = sqlite.prepare(`SELECT * FROM "${schema.name}" LIMIT 1`)
  return stmt.get()
}

export function createItem(schema: SchemaDefinition, data: Record<string, unknown>): unknown {
  const id = randomUUID()
  const now = new Date().toISOString()
  const fields = schema.fields.map((f) => f.name)
  const values: SQLBindValue[] = [id]
  const placeholders: string[] = ['?']
  const columns: string[] = ['"id"']

  for (const field of fields) {
    columns.push(`"${field}"`)
    placeholders.push('?')
    values.push(data[field] as SQLBindValue ?? null)
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
      values.push(data[field.name] as SQLBindValue)
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
