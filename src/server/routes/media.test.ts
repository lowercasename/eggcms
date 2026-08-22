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
  delete process.env.MAX_UPLOAD_MB
})

describe('media routes - accepted file types', () => {
  it('accepts a PDF and classifies it as a document', async () => {
    const res = await uploadFile(makeFile('essay.pdf', 'PDF-BYTES', 'application/pdf'))

    expect(res.status).toBe(201)
    expect(res.data.data.kind).toBe('document')
    expect(res.data.data.mimetype).toBe('application/pdf')
    expect(res.data.data.filename).toBe('essay.pdf')
  })

  it('still accepts images', async () => {
    const res = await uploadFile(makeFile('photo.jpg', 'JPEG-BYTES', 'image/jpeg'))

    expect(res.status).toBe(201)
    expect(res.data.data.kind).toBe('image')
  })

  it('accepts audio and video', async () => {
    const audio = await uploadFile(makeFile('talk.mp3', 'MP3', 'audio/mpeg'))
    const video = await uploadFile(makeFile('clip.mp4', 'MP4', 'video/mp4'))

    expect(audio.data.data.kind).toBe('audio')
    expect(video.data.data.kind).toBe('video')
  })

  it('accepts a PDF that the browser reported as octet-stream', async () => {
    // Safari and some Windows browsers do this; going by the extension keeps
    // the upload from being refused for no reason the user can see.
    const res = await uploadFile(makeFile('scan.pdf', 'PDF', 'application/octet-stream'))

    expect(res.status).toBe(201)
    expect(res.data.data.mimetype).toBe('application/pdf')
    expect(res.data.data.kind).toBe('document')
  })

  it('rejects a type that is not allowed, and names it', async () => {
    const res = await uploadFile(makeFile('installer.exe', 'MZ', 'application/x-msdownload'))

    expect(res.status).toBe(400)
    expect(res.data.error.message).toContain('application/x-msdownload')
  })
})

describe('media routes - size limit', () => {
  it('rejects a file over MAX_UPLOAD_MB', async () => {
    process.env.MAX_UPLOAD_MB = '1'
    const res = await uploadFile(
      makeFile('huge.pdf', 'x'.repeat(2 * 1024 * 1024), 'application/pdf')
    )

    expect(res.status).toBe(413)
    expect(res.data.error.message).toMatch(/The limit is 1\.0 MB/)
  })

  it('accepts a file under the limit', async () => {
    process.env.MAX_UPLOAD_MB = '1'
    const res = await uploadFile(makeFile('small.pdf', 'x'.repeat(1024), 'application/pdf'))

    expect(res.status).toBe(201)
  })
})

describe('media routes - listing', () => {
  it('includes the kind of each item', async () => {
    await uploadFile(makeFile('essay.pdf', 'PDF', 'application/pdf'))
    await uploadFile(makeFile('photo.jpg', 'JPEG', 'image/jpeg'))

    const list = await (await media.request('/')).json()
    const kinds = list.data.map((m: { kind: string }) => m.kind).sort()
    expect(kinds).toEqual(['document', 'image'])
  })

  it('filters by kind', async () => {
    await uploadFile(makeFile('essay.pdf', 'PDF', 'application/pdf'))
    await uploadFile(makeFile('photo.jpg', 'JPEG', 'image/jpeg'))

    const list = await (await media.request('/?kind=document')).json()
    expect(list.data).toHaveLength(1)
    expect(list.data[0].filename).toBe('essay.pdf')
  })

  it('ignores an unknown kind filter rather than returning nothing', async () => {
    await uploadFile(makeFile('photo.jpg', 'JPEG', 'image/jpeg'))

    const list = await (await media.request('/?kind=nonsense')).json()
    expect(list.data).toHaveLength(1)
  })
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
