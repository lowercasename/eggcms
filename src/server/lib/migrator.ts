// src/server/lib/migrator.ts
import { sqlite, db } from '../db'
import { schemasTable } from '../db/tables'
import { eq } from 'drizzle-orm'
import { validateSchema, type SchemaDefinition } from '../../lib/schema'
import { generateTableSql, hashSchema } from './migrate'

export async function runMigrations(schemas: SchemaDefinition[]): Promise<void> {
  // Create internal tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "_schemas" (
      "name" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL,
      "hash" TEXT NOT NULL,
      "fields_json" TEXT NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "_media" (
      "id" TEXT PRIMARY KEY,
      "filename" TEXT NOT NULL,
      "path" TEXT NOT NULL,
      "mimetype" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "width" INTEGER,
      "height" INTEGER,
      "alt" TEXT,
      "created_at" TEXT NOT NULL
    )
  `)

  for (const schema of schemas) {
    // Validate schema
    validateSchema(schema)

    // Skip blocks (they're not tables)
    if (schema.type === 'block') continue

    const hash = hashSchema(schema)
    const existing = db.select().from(schemasTable).where(eq(schemasTable.name, schema.name)).get()

    if (!existing) {
      // New schema - create table
      console.log(`Creating table for schema: ${schema.name}`)
      const sql = generateTableSql(schema)
      sqlite.exec(sql)

      // Record schema
      db.insert(schemasTable).values({
        name: schema.name,
        type: schema.type,
        hash,
        fieldsJson: JSON.stringify(schema.fields),
      }).run()
    } else if (existing.hash !== hash) {
      // Schema changed - handle migration
      console.log(`Schema changed: ${schema.name}`)
      await handleSchemaMigration(schema, existing, hash)
    }
  }
}

async function handleSchemaMigration(
  schema: SchemaDefinition,
  existing: { fieldsJson: string; hash: string },
  newHash: string
): Promise<void> {
  const oldFields = JSON.parse(existing.fieldsJson) as Array<{ name: string; type: string }>
  const newFields = schema.fields

  const oldFieldNames = new Set(oldFields.map((f) => f.name))
  const newFieldNames = new Set(newFields.map((f) => f.name))

  // Add new columns
  for (const field of newFields) {
    if (!oldFieldNames.has(field.name)) {
      const sqlType = field.type === 'number' ? 'REAL' : field.type === 'boolean' ? 'INTEGER' : 'TEXT'
      const defaultVal = field.default !== undefined
        ? ` DEFAULT ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`
        : ''
      console.log(`  Adding column: ${field.name}`)
      sqlite.exec(`ALTER TABLE "${schema.name}" ADD COLUMN "${field.name}" ${sqlType}${defaultVal}`)
    }
  }

  // Check for removed columns (just warn, don't drop)
  for (const oldField of oldFields) {
    if (!newFieldNames.has(oldField.name)) {
      console.warn(`  Warning: Field '${oldField.name}' removed from schema but column kept in database`)
    }
  }

  // Update schema record
  db.update(schemasTable)
    .set({ hash: newHash, fieldsJson: JSON.stringify(schema.fields) })
    .where(eq(schemasTable.name, schema.name))
    .run()
}
