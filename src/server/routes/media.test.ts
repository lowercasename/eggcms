// @vitest-environment node
// src/server/routes/media.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted state shared with mocks. Use better-sqlite3 (already a dep, drives
// drizzle-kit) — bun:sqlite is unavailable in the vitest/jsdom test runner.
const { state, savedFiles, deletedPaths } = vi.hoisted(() => ({
  state: { sqlite: null as null | import('better-sqlite3').Database },
  savedFiles: [] as Array<{ name: string; path: string }>,
  deletedPaths: [] as string[],
}))

vi.mock('../db', async () => {
  const Database = (await import('better-sqlite3')).default
  state.sqlite = new Database(':memory:')
  return { sqlite: state.sqlite }
})

vi.mock('../middleware/auth', () => ({
  requireAuth: vi.fn((_c, next) => next()),
}))

vi.mock('../lib/storage', () => ({
  createStorage: () => ({
    async save(file: File) {
      const path = `/uploads/file-${savedFiles.length}.bin`
      savedFiles.push({ name: file.name, path })
      return { path, filename: file.name }
    },
    async delete(filePath: string) {
      deletedPaths.push(filePath)
    },
    getUrl: (p: string) => p,
  }),
}))

vi.mock('sharp', () => ({
  default: () => ({ metadata: async () => ({ width: 0, height: 0 }) }),
}))

// Import after mocks
import media from './media'

const CREATE_MEDIA = `
  CREATE TABLE _media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    alt TEXT,
    hash TEXT,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )
`

function makeFile(name: string, contents: string, type = 'image/png'): File {
  return new File([contents], name, { type })
}

async function uploadFile(file: File): Promise<{ status: number; data: any }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await media.request('/', { method: 'POST', body: formData })
  return { status: res.status, data: await res.json() }
}

function db() {
  if (!state.sqlite) throw new Error('sqlite mock not initialized')
  return state.sqlite
}

beforeEach(() => {
  db().exec('DROP TABLE IF EXISTS _media')
  db().exec(CREATE_MEDIA)
  savedFiles.length = 0
  deletedPaths.length = 0
})

describe('media routes - upload dedupe by content hash', () => {
  it('reuses existing media when uploading identical bytes', async () => {
    const first = await uploadFile(makeFile('a.png', 'IDENTICAL-BYTES'))
    expect(first.status).toBe(201)
    const firstId = first.data.data.id
    const firstPath = first.data.data.path

    const second = await uploadFile(makeFile('b.png', 'IDENTICAL-BYTES'))
    expect(second.status).toBe(201)

    expect(second.data.data.id).toBe(firstId)
    expect(second.data.data.path).toBe(firstPath)
    expect(savedFiles).toHaveLength(1) // storage.save called only once
  })

  it('treats different bytes as different media', async () => {
    const a = await uploadFile(makeFile('a.png', 'AAAA'))
    const b = await uploadFile(makeFile('b.png', 'BBBB'))

    expect(a.data.data.id).not.toBe(b.data.data.id)
    expect(savedFiles).toHaveLength(2)
  })

  it('un-hides a soft-deleted media when same bytes are re-uploaded', async () => {
    const first = await uploadFile(makeFile('a.png', 'BYTES'))
    const id = first.data.data.id

    const delRes = await media.request(`/${id}`, { method: 'DELETE' })
    expect(delRes.status).toBe(200)

    const second = await uploadFile(makeFile('again.png', 'BYTES'))
    expect(second.data.data.id).toBe(id)
    expect(savedFiles).toHaveLength(1)

    // It should now appear in the list again
    const listRes = await media.request('/')
    const list = await listRes.json()
    expect(list.data.map((m: { id: string }) => m.id)).toContain(id)
  })
})

describe('media routes - soft delete', () => {
  it('hides item from list but does not remove file from storage', async () => {
    const upload = await uploadFile(makeFile('a.png', 'BYTES'))
    const id = upload.data.data.id

    const delRes = await media.request(`/${id}`, { method: 'DELETE' })
    expect(delRes.status).toBe(200)

    expect(deletedPaths).toHaveLength(0) // file not removed

    const listRes = await media.request('/')
    const list = await listRes.json()
    expect(list.data.map((m: { id: string }) => m.id)).not.toContain(id)
  })

  it('keeps the row in the database (soft delete)', async () => {
    const upload = await uploadFile(makeFile('a.png', 'BYTES'))
    const id = upload.data.data.id

    await media.request(`/${id}`, { method: 'DELETE' })

    const row = db().prepare('SELECT id, hidden FROM _media WHERE id = ?').get(id) as {
      id: string
      hidden: number
    } | undefined
    expect(row).toBeDefined()
    expect(row?.hidden).toBe(1)
  })

  it('returns 404 for unknown id', async () => {
    const res = await media.request('/nonexistent-id', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})
