// src/admin/lib/media.test.ts
import { describe, it, expect } from 'vitest'
import { describeUsage, extensionOf, formatSize, sortMedia, type MediaItem } from './media'

const item = (over: Partial<MediaItem>): MediaItem => ({
  id: 'x',
  filename: 'a.jpg',
  path: '/uploads/a.jpg',
  mimetype: 'image/jpeg',
  kind: 'image',
  size: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  references: [],
  ...over,
})

describe('describeUsage', () => {
  it('says a file is not used yet', () => {
    expect(describeUsage([])).toEqual({ text: 'Not used yet', used: false })
  })
  it('counts pages when every use is in one collection', () => {
    const refs = [
      { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection' as const, id: '1', label: 'A' },
      { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection' as const, id: '2', label: 'B' },
    ]
    expect(describeUsage(refs)).toEqual({ text: 'Used on 2 pages', used: true })
  })
  it('names a single page', () => {
    expect(describeUsage([{ schema: 'page', schemaLabel: 'Pages', schemaType: 'collection' as const, id: '1', label: 'A' }]).text).toBe('Used on 1 page')
  })
  it('names a singleton in full', () => {
    expect(describeUsage([{ schema: 'settings', schemaLabel: 'Site Settings', schemaType: 'singleton' as const, id: 'settings', label: 'Site Settings' }]).text).toBe(
      'Used in Site Settings'
    )
  })
  it('falls back to places when uses are spread across kinds of content', () => {
    const refs = [
      { schema: 'page', schemaLabel: 'Pages', schemaType: 'collection' as const, id: '1', label: 'A' },
      { schema: 'post', schemaLabel: 'Blog Posts', schemaType: 'collection' as const, id: '2', label: 'B' },
    ]
    expect(describeUsage(refs).text).toBe('Used in 2 places')
  })
})

describe('extensionOf', () => {
  it('reads the extension from the filename, upper-cased', () => {
    expect(extensionOf(item({ filename: 'Russian Anzacs.jpg' }))).toBe('JPG')
  })
  it('falls back to the mime subtype', () => {
    expect(extensionOf(item({ filename: 'noext', mimetype: 'application/pdf' }))).toBe('PDF')
  })
})

describe('formatSize', () => {
  it('formats bytes, KB and MB', () => {
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(5900)).toBe('5.8 KB')
    expect(formatSize(4.1 * 1024 * 1024)).toBe('4.1 MB')
  })
})

describe('sortMedia', () => {
  const a = item({ id: 'a', filename: 'beta.jpg', created_at: '2026-01-02T00:00:00.000Z' })
  const b = item({ id: 'b', filename: 'alpha.jpg', created_at: '2026-01-03T00:00:00.000Z' })
  it('newest first by default', () => {
    expect(sortMedia([a, b], 'newest').map((i) => i.id)).toEqual(['b', 'a'])
  })
  it('oldest first', () => {
    expect(sortMedia([a, b], 'oldest').map((i) => i.id)).toEqual(['a', 'b'])
  })
  it('by name', () => {
    expect(sortMedia([a, b], 'name').map((i) => i.id)).toEqual(['b', 'a'])
  })
})
