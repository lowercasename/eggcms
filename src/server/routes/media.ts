// src/server/routes/media.ts
import { createHash, randomUUID } from 'crypto'
import { Hono } from 'hono'
import sharp from 'sharp'
import { requireAuth } from '../middleware/auth'
import { createStorage } from '../lib/storage'
import { toPublicUrl } from '../lib/url'
import {
  ALLOWED_MIME_TYPES,
  formatBytes,
  isAllowedMimeType,
  kindForMimeType,
  maxUploadBytes,
  resolveMimeType,
  type MediaKind,
} from '../lib/mediaTypes'
import { sqlite } from '../db'

const media = new Hono()
const storage = createStorage()

interface MediaItem {
  id: string
  filename: string
  path: string
  mimetype: string
  size: number
  width: number | null
  height: number | null
  hash: string | null
  hidden: number
  created_at: string
}

type MediaItemResponse = MediaItem & { kind: MediaKind | null }

function present(item: MediaItem): MediaItemResponse {
  return { ...item, path: toPublicUrl(item.path), kind: kindForMimeType(item.mimetype) }
}

// GET /api/media - List all visible media (hidden items excluded).
// Optional ?kind=image|document|audio|video narrows the list. An unrecognised
// kind is ignored rather than returning an empty library.
media.get('/', (c) => {
  const kind = c.req.query('kind')
  const types = Object.entries(ALLOWED_MIME_TYPES)
    .filter(([, k]) => k === kind)
    .map(([type]) => type)

  const items =
    types.length > 0
      ? (sqlite
          .prepare(
            `SELECT * FROM _media WHERE hidden = 0 AND mimetype IN (${types
              .map(() => '?')
              .join(', ')}) ORDER BY created_at DESC`
          )
          .all(...types) as MediaItem[])
      : (sqlite
          .prepare('SELECT * FROM _media WHERE hidden = 0 ORDER BY created_at DESC')
          .all() as MediaItem[])

  return c.json({ data: items.map(present), meta: { total: items.length } })
})

// POST /api/media - Upload file (with content-hash dedupe)
media.post('/', requireAuth, async (c) => {
  const body = await c.req.parseBody()
  const file = body.file

  if (!file || !(file instanceof File)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'No file provided' } }, 400)
  }

  // Browsers disagree about types (Safari sends octet-stream for PDFs), so
  // fall back to the extension before deciding.
  const mimetype = resolveMimeType(file.type, file.name)

  if (!isAllowedMimeType(mimetype)) {
    return c.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: `Files of type ${mimetype || 'unknown'} can't be uploaded`,
        },
      },
      400
    )
  }

  const limit = maxUploadBytes()
  if (file.size > limit) {
    return c.json(
      {
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(limit)}.`,
        },
      },
      413
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const hash = createHash('sha256').update(buffer).digest('hex')

  // Dedupe: if a row with the same hash exists, reuse it.
  // If it was soft-deleted, restore (un-hide) it.
  const existing = sqlite
    .prepare('SELECT * FROM _media WHERE hash = ? LIMIT 1')
    .get(hash) as MediaItem | undefined

  if (existing) {
    if (existing.hidden) {
      sqlite.prepare('UPDATE _media SET hidden = 0 WHERE id = ?').run(existing.id)
      existing.hidden = 0
    }
    return c.json({ data: present(existing) }, 201)
  }

  let filePath: string
  let filename: string
  let width: number | null = null
  let height: number | null = null

  try {
    if (mimetype.startsWith('image/') && mimetype !== 'image/svg+xml') {
      try {
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || null
        height = metadata.height || null
      } catch {
        // Non-fatal: continue without dimensions
      }
    }

    const saved = await storage.save(file)
    filePath = saved.path
    filename = saved.filename
  } catch (err) {
    return c.json({ error: { code: 'STORAGE_ERROR', message: 'Failed to save file' } }, 500)
  }

  const now = new Date().toISOString()
  const id = randomUUID()

  sqlite.prepare(`
    INSERT INTO _media (id, filename, path, mimetype, size, width, height, hash, hidden, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, filename, filePath, mimetype, file.size, width, height, hash, now)

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(id) as MediaItem

  return c.json({ data: present(item) }, 201)
})

// DELETE /api/media/:id - Soft-delete: hide from library, keep file on disk so
// existing references in content keep working.
media.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')

  const item = sqlite.prepare('SELECT id FROM _media WHERE id = ?').get(id) as
    | { id: string }
    | undefined

  if (!item) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, 404)
  }

  sqlite.prepare('UPDATE _media SET hidden = 1 WHERE id = ?').run(id)

  return c.json({ data: { success: true } })
})

export default media
