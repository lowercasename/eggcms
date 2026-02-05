// src/server/routes/media.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { createStorage } from '../lib/storage'
import { sqlite } from '../db'

const media = new Hono()
const storage = createStorage()

// GET /api/media - List all media
media.get('/', (c) => {
  const items = sqlite.prepare('SELECT * FROM _media ORDER BY created_at DESC').all()
  return c.json({ data: items, meta: { total: items.length } })
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

  const { path: filePath, filename } = await storage.save(file)
  const now = new Date().toISOString()

  const result = sqlite.prepare(`
    INSERT INTO _media (filename, path, mimetype, size, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(filename, filePath, file.type, file.size, now)

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(result.lastInsertRowid)

  return c.json({ data: item }, 201)
})

// DELETE /api/media/:id - Delete file
media.delete('/:id', requireAuth, async (c) => {
  const id = parseInt(c.req.param('id'))

  const item = sqlite.prepare('SELECT * FROM _media WHERE id = ?').get(id) as { path: string } | undefined

  if (!item) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Media not found' } }, 404)
  }

  await storage.delete(item.path)
  sqlite.prepare('DELETE FROM _media WHERE id = ?').run(id)

  return c.json({ data: { success: true } })
})

export default media
