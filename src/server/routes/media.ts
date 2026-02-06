// src/server/routes/media.ts
import { randomUUID } from 'crypto'
import { Hono } from 'hono'
import sharp from 'sharp'
import { requireAuth } from '../middleware/auth'
import { createStorage } from '../lib/storage'
import { toPublicUrl } from '../lib/url'
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
  created_at: string
}

function withPublicUrl(item: MediaItem): MediaItem {
  return { ...item, path: toPublicUrl(item.path) }
}

// GET /api/media - List all media
media.get('/', (c) => {
  const items = sqlite.prepare('SELECT * FROM _media ORDER BY created_at DESC').all() as MediaItem[]
  return c.json({ data: items.map(withPublicUrl), meta: { total: items.length } })
})

// POST /api/media - Upload file
media.post('/', requireAuth, async (c) => {
  const body = await c.req.parseBody()
  const file = body.file

  if (!file || !(file instanceof File)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'No file provided' } }, 400)
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid file type' } }, 400)
  }

  let filePath: string
  let filename: string
  let width: number | null = null
  let height: number | null = null

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    // Get image dimensions for supported formats
    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
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
    INSERT INTO _media (id, filename, path, mimetype, size, width, height, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, filename, filePath, file.type, file.size, width, height, now)

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(id) as MediaItem

  return c.json({ data: withPublicUrl(item) }, 201)
})

// DELETE /api/media/:id - Delete file
media.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(id) as { path: string } | undefined

  if (!item) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, 404)
  }

  try {
    await storage.delete(item.path)
  } catch (err) {
    return c.json({ error: { code: 'STORAGE_ERROR', message: 'Failed to delete file' } }, 500)
  }

  sqlite.prepare('DELETE FROM _media WHERE id = ?').run(id)

  return c.json({ data: { success: true } })
})

export default media
