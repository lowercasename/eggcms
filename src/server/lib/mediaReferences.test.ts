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

import { findAllMediaReferences, describeReferences } from './mediaReferences'
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
      { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection', id: 'p1', label: 'Australia' },
      { schema: 'settings', schemaLabel: 'Site Settings', schemaType: 'singleton', id: 'settings', label: 'Site Settings' },
    ])
    // An untitled item falls back to the schema label.
    expect(refs.get('/uploads/b.pdf')).toEqual([{ schema: 'page', schemaLabel: 'Pages', schemaType: 'collection', id: 'p2', label: 'Pages' }])
    expect(refs.get('/uploads/c.mp3')).toEqual([])
  })

  it('skips a schema whose table does not exist yet', () => {
    expect(() => findAllMediaReferences(schemas, ['/uploads/a.png'])).not.toThrow()
  })

  it('does not treat a path as used because a longer path starts with it', () => {
    db().prepare('INSERT INTO page VALUES (?, ?, ?)').run('p1', 'Thesis', '<a href="/uploads/thesis.docx">read</a>')
    const refs = findAllMediaReferences(schemas, ['/uploads/thesis.doc', '/uploads/thesis.docx'])
    expect(refs.get('/uploads/thesis.doc')).toEqual([])
    expect(refs.get('/uploads/thesis.docx')).toHaveLength(1)
  })

  it('still matches a path at the end of a URL, before a query string, or inside JSON', () => {
    db().prepare('INSERT INTO page VALUES (?, ?, ?)').run('p1', 'A', 'https://x.org/uploads/a.png')
    db().prepare('INSERT INTO page VALUES (?, ?, ?)').run('p2', 'B', '<img src="/uploads/a.png?v=2">')
    db().prepare('INSERT INTO page VALUES (?, ?, ?)').run('p3', 'C', JSON.stringify([{ _type: 'photo', src: '/uploads/a.png' }]))
    expect(findAllMediaReferences(schemas, ['/uploads/a.png']).get('/uploads/a.png')?.map((r) => r.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('rethrows database errors other than a missing table, so a delete cannot proceed blind', () => {
    db().exec('DROP VIEW IF EXISTS broken; CREATE VIEW broken AS SELECT nosuchfunction(1) AS id, 1 AS title, 1 AS body')
    const broken = { ...schemas[0], name: 'broken' }
    expect(() => findAllMediaReferences([broken], ['/uploads/a.png'])).toThrow(/no such function/)
  })
})

describe('describeReferences', () => {
  it('names the page and its kind in plain words', () => {
    expect(describeReferences([{ schema: 'page', schemaLabel: 'Pages', schemaType: 'collection', id: 'p1', label: 'Australia' }])).toBe('the page “Australia”')
    expect(describeReferences([{ schema: 'settings', schemaLabel: 'Site Settings', schemaType: 'singleton', id: 'settings', label: 'Site Settings' }])).toBe('Site Settings')
    expect(
      describeReferences([
        { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection', id: 'p1', label: 'Australia' },
        { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection', id: 'p2', label: 'Belarus' },
        { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection', id: 'p3', label: 'Family' },
      ])
    ).toBe('the page “Australia” and 2 others')
  })
})
