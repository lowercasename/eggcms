// src/server/lib/migrate.test.ts
import { describe, it, expect } from 'vitest'
import { generateTableSql, hashSchema } from './migrate'
import { defineCollection, f } from '../../lib/schema'

describe('generateTableSql', () => {
  it('generates CREATE TABLE for collection', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [
        f.string('title', { required: true }),
        f.number('views'),
        f.boolean('featured'),
      ],
    })

    const sql = generateTableSql(schema)

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "post"')
    expect(sql).toContain('"id" TEXT PRIMARY KEY')  // UUID, not INTEGER AUTOINCREMENT
    expect(sql).toContain('"title" TEXT NOT NULL')
    expect(sql).toContain('"views" REAL')
    expect(sql).toContain('"featured" INTEGER')
    expect(sql).toContain('"draft" INTEGER DEFAULT 1')
    expect(sql).toContain('"created_at" TEXT')
    expect(sql).toContain('"updated_at" TEXT')
  })
})

describe('hashSchema', () => {
  it('produces consistent hash for same schema', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title')],
    })
    expect(hashSchema(schema)).toBe(hashSchema(schema))
  })

  it('produces different hash when fields change', () => {
    const schema1 = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title')],
    })
    const schema2 = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title'), f.string('body')],
    })
    expect(hashSchema(schema1)).not.toBe(hashSchema(schema2))
  })
})
