// @vitest-environment node
// src/server/lib/mediaReferences.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { state } = vi.hoisted(() => ({
  state: { sqlite: null as null | import('better-sqlite3').Database },
}))

vi.mock('../db', async () => {
  const Database = (await import('better-sqlite3')).default
  state.sqlite = new Database(':memory:')
  return { sqlite: state.sqlite }
})

import { findAllMediaReferences } from './mediaReferences'
import type { SchemaDefinition } from '../../lib/schema'

const schemas: SchemaDefinition[] = [
  { name: 'page', label: 'Pages', type: 'collection', fields: [{ name: 'title', type: 'string' }, { name: 'body', type: 'richtext' }] },
  { name: 'settings', label: 'Site Settings', type: 'singleton', fields: [{ name: 'logo', type: 'image' }] },
  { name: 'missing', label: 'Missing', type: 'collection', fields: [{ name: 'x', type: 'string' }] },
]

function db() {
  if (!state.sqlite) throw new Error('no db')
  return state.sqlite
}

beforeEach(() => {
  db().exec('DROP TABLE IF EXISTS page; CREATE TABLE page (id TEXT PRIMARY KEY, title TEXT, body TEXT)')
  db().exec('DROP TABLE IF EXISTS settings; CREATE TABLE settings (id TEXT PRIMARY KEY, logo TEXT)')
})

describe('findAllMediaReferences', () => {
  it('maps every path to the items that mention it, scanning each table once', () => {
    db().prepare('INSERT INTO page VALUES (?, ?, ?)').run('p1', 'Australia', '<img src="/uploads/a.png">')
    db().prepare('INSERT INTO page VALUES (?, ?, ?)').run('p2', '', '<a href="https://x.org/uploads/b.pdf">b</a>')
    db().prepare('INSERT INTO settings VALUES (?, ?)').run('settings', '/uploads/a.png')

    const refs = findAllMediaReferences(schemas, ['/uploads/a.png', '/uploads/b.pdf', '/uploads/c.mp3'])

    expect(refs.get('/uploads/a.png')).toEqual([
      { schema: 'page', schemaLabel: 'Pages', id: 'p1', label: 'Australia' },
      { schema: 'settings', schemaLabel: 'Site Settings', id: 'settings', label: 'Site Settings' },
    ])
    // An untitled item falls back to the schema label.
    expect(refs.get('/uploads/b.pdf')).toEqual([{ schema: 'page', schemaLabel: 'Pages', id: 'p2', label: 'Pages' }])
    expect(refs.get('/uploads/c.mp3')).toEqual([])
  })

  it('skips a schema whose table does not exist yet', () => {
    expect(() => findAllMediaReferences(schemas, ['/uploads/a.png'])).not.toThrow()
  })
})
