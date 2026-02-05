// src/server/lib/migrate.ts
import type { SchemaDefinition, FieldDefinition } from '../../lib/schema'

function fieldToSqlType(field: FieldDefinition): string {
  const typeMap: Record<string, string> = {
    string: 'TEXT',
    text: 'TEXT',
    richtext: 'TEXT',
    slug: 'TEXT',
    select: 'TEXT',
    image: 'TEXT',
    datetime: 'TEXT',
    blocks: 'TEXT',
    number: 'REAL',
    boolean: 'INTEGER',
  }
  return typeMap[field.type] || 'TEXT'
}

export function generateTableSql(schema: SchemaDefinition): string {
  const columns: string[] = []

  // Primary key - UUID as TEXT
  columns.push('"id" TEXT PRIMARY KEY')

  // User-defined fields
  for (const field of schema.fields) {
    const sqlType = fieldToSqlType(field)
    const notNull = field.required ? ' NOT NULL' : ''
    const defaultVal = field.default !== undefined
      ? ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`
      : ''
    columns.push(`"${field.name}" ${sqlType}${notNull}${defaultVal}`)
  }

  // Collection-specific columns
  if (schema.type === 'collection') {
    columns.push('"draft" INTEGER DEFAULT 1')
  }

  // Timestamps
  columns.push('"created_at" TEXT')
  columns.push('"updated_at" TEXT')

  return `CREATE TABLE IF NOT EXISTS "${schema.name}" (\n  ${columns.join(',\n  ')}\n)`
}
