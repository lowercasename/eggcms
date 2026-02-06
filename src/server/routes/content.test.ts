// src/server/routes/content.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SchemaDefinition } from '../../lib/schema'

// Hoist mock functions
const { mockContent, mockFireWebhook, mockShouldFireWebhook } = vi.hoisted(() => ({
  mockContent: {
    getSchema: vi.fn(),
    listItems: vi.fn(),
    getItem: vi.fn(),
    getSingleton: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    upsertSingleton: vi.fn(),
  },
  mockFireWebhook: vi.fn(),
  mockShouldFireWebhook: vi.fn(),
}))

vi.mock('../lib/content', () => mockContent)
vi.mock('../lib/webhook', () => ({
  fireWebhook: mockFireWebhook,
  shouldFireWebhook: mockShouldFireWebhook,
}))

// Mock auth middleware
vi.mock('../middleware/auth', () => ({
  requireAuth: vi.fn((c, next) => {
    const authHeader = c.req.header('Authorization')
    if (authHeader === 'Bearer valid-token') {
      c.set('user', { email: 'test@example.com' })
      return next()
    }
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401)
  }),
  optionalAuth: vi.fn((c, next) => {
    const authHeader = c.req.header('Authorization')
    if (authHeader === 'Bearer valid-token') {
      c.set('user', { email: 'test@example.com' })
    }
    return next()
  }),
}))

// Import after mocks
import { createContentRoutes } from './content'

describe('content routes', () => {
  const testSchemas: SchemaDefinition[] = [
    {
      name: 'posts',
      label: 'Posts',
      type: 'collection',
      fields: [
        { name: 'title', type: 'string', required: true },
        { name: 'content', type: 'richtext' },
      ],
    },
    {
      name: 'settings',
      label: 'Settings',
      type: 'singleton',
      fields: [
        { name: 'siteName', type: 'string', required: true },
      ],
    },
  ]

  let app: ReturnType<typeof createContentRoutes>
  const originalPublicApi = process.env.PUBLIC_API

  beforeEach(() => {
    vi.clearAllMocks()
    app = createContentRoutes(testSchemas)
    delete process.env.PUBLIC_API // Default to public API enabled
    mockContent.getSchema.mockImplementation((schemas, name) =>
      schemas.find((s: SchemaDefinition) => s.name === name && s.type !== 'block')
    )
  })

  afterEach(() => {
    if (originalPublicApi) {
      process.env.PUBLIC_API = originalPublicApi
    } else {
      delete process.env.PUBLIC_API
    }
  })

  describe('GET /_schemas', () => {
    it('returns schemas when authenticated', async () => {
      const res = await app.request('/_schemas', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(2)
      expect(json.data[0].name).toBe('posts')
      expect(json.data[1].name).toBe('settings')
    })

    it('returns 401 when not authenticated', async () => {
      const res = await app.request('/_schemas')

      expect(res.status).toBe(401)
    })

    it('excludes block type schemas', async () => {
      const schemasWithBlock: SchemaDefinition[] = [
        ...testSchemas,
        { name: 'imageBlock', label: 'Image Block', type: 'block', fields: [] },
      ]
      const appWithBlock = createContentRoutes(schemasWithBlock)

      const res = await appWithBlock.request('/_schemas', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      const json = await res.json()
      expect(json.data).toHaveLength(2)
      expect(json.data.find((s: { name: string }) => s.name === 'imageBlock')).toBeUndefined()
    })
  })

  describe('GET /:schema (list)', () => {
    it('returns items for collection', async () => {
      const mockItems = [
        { id: '1', title: 'Post 1', _meta: { draft: false } },
        { id: '2', title: 'Post 2', _meta: { draft: true } },
      ]
      mockContent.listItems.mockReturnValue(mockItems)

      const res = await app.request('/posts')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual(mockItems)
      expect(json.meta.total).toBe(2)
    })

    it('returns singleton data', async () => {
      const mockSingleton = { id: '1', siteName: 'My Site', _meta: {} }
      mockContent.getSingleton.mockReturnValue(mockSingleton)

      const res = await app.request('/settings')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual(mockSingleton)
    })

    it('returns empty object for missing singleton', async () => {
      mockContent.getSingleton.mockReturnValue(undefined)

      const res = await app.request('/settings')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual({})
    })

    it('returns 404 for unknown schema', async () => {
      const res = await app.request('/unknown')

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error.code).toBe('NOT_FOUND')
    })

    it('excludes drafts by default for public API', async () => {
      mockContent.listItems.mockReturnValue([])

      await app.request('/posts')

      expect(mockContent.listItems).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'posts' }),
        false
      )
    })

    it('includes drafts when authenticated and requested', async () => {
      mockContent.listItems.mockReturnValue([])

      await app.request('/posts?drafts=true', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(mockContent.listItems).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'posts' }),
        true
      )
    })

    it('ignores drafts param when not authenticated', async () => {
      mockContent.listItems.mockReturnValue([])

      await app.request('/posts?drafts=true')

      expect(mockContent.listItems).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'posts' }),
        false
      )
    })

    it('returns 401 when PUBLIC_API is false and not authenticated', async () => {
      process.env.PUBLIC_API = 'false'

      const res = await app.request('/posts')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /:schema/:id', () => {
    it('returns item by id', async () => {
      const mockItem = { id: '123', title: 'Test Post', _meta: { draft: false } }
      mockContent.getItem.mockReturnValue(mockItem)

      const res = await app.request('/posts/123')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual(mockItem)
    })

    it('returns 404 for missing item', async () => {
      mockContent.getItem.mockReturnValue(undefined)

      const res = await app.request('/posts/nonexistent')

      expect(res.status).toBe(404)
    })

    it('returns 404 for draft item when not authenticated', async () => {
      const mockItem = { id: '123', title: 'Draft Post', _meta: { draft: true } }
      mockContent.getItem.mockReturnValue(mockItem)

      const res = await app.request('/posts/123')

      expect(res.status).toBe(404)
    })

    it('returns draft item when authenticated', async () => {
      const mockItem = { id: '123', title: 'Draft Post', _meta: { draft: true } }
      mockContent.getItem.mockReturnValue(mockItem)

      const res = await app.request('/posts/123', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual(mockItem)
    })

    it('returns 404 for singleton schema', async () => {
      const res = await app.request('/settings/123')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /:schema (create)', () => {
    it('creates item and returns 201', async () => {
      const mockCreated = { id: 'new-id', title: 'New Post', _meta: { draft: true } }
      mockContent.createItem.mockReturnValue(mockCreated)
      mockShouldFireWebhook.mockReturnValue(false)

      const res = await app.request('/posts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Post' }),
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.data).toEqual(mockCreated)
    })

    it('requires authentication', async () => {
      const res = await app.request('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Post' }),
      })

      expect(res.status).toBe(401)
    })

    it('fires webhook when publishing', async () => {
      const mockCreated = { id: 'new-id', title: 'New Post', _meta: { draft: false } }
      mockContent.createItem.mockReturnValue(mockCreated)
      mockShouldFireWebhook.mockReturnValue(true)

      await app.request('/posts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Post', draft: 0 }),
      })

      expect(mockFireWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'content.updated',
          schema: 'posts',
          id: 'new-id',
        })
      )
    })

    it('upserts singleton', async () => {
      const mockUpserted = { id: '1', siteName: 'New Name', _meta: {} }
      mockContent.upsertSingleton.mockReturnValue(mockUpserted)

      const res = await app.request('/settings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteName: 'New Name' }),
      })

      expect(res.status).toBe(200)
      expect(mockContent.upsertSingleton).toHaveBeenCalled()
    })

    it('returns 404 for unknown schema', async () => {
      const res = await app.request('/unknown', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(404)
    })

    it('returns 500 with JSON error when database throws', async () => {
      mockContent.createItem.mockImplementation(() => {
        throw new Error('NOT NULL constraint failed: posts.title')
      })

      const res = await app.request('/posts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBeDefined()
      expect(json.error.code).toBe('DATABASE_ERROR')
    })

    it('returns 500 with JSON error when singleton upsert throws', async () => {
      mockContent.upsertSingleton.mockImplementation(() => {
        throw new Error('SQLITE_CONSTRAINT')
      })

      const res = await app.request('/settings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBeDefined()
      expect(json.error.code).toBe('DATABASE_ERROR')
    })
  })

  describe('PUT /:schema/:id (update)', () => {
    it('updates item and returns 200', async () => {
      const mockExisting = { id: '123', title: 'Old Title', _meta: { draft: true } }
      const mockUpdated = { id: '123', title: 'New Title', _meta: { draft: false } }
      mockContent.getItem.mockReturnValue(mockExisting)
      mockContent.updateItem.mockReturnValue(mockUpdated)
      mockShouldFireWebhook.mockReturnValue(true)

      const res = await app.request('/posts/123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Title', draft: 0 }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toEqual(mockUpdated)
    })

    it('requires authentication', async () => {
      const res = await app.request('/posts/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      })

      expect(res.status).toBe(401)
    })

    it('returns 404 for missing item', async () => {
      mockContent.getItem.mockReturnValue(undefined)

      const res = await app.request('/posts/123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'New Title' }),
      })

      expect(res.status).toBe(404)
    })

    it('returns 404 for singleton', async () => {
      const res = await app.request('/settings/123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(404)
    })

    it('fires webhook when publishing', async () => {
      mockContent.getItem.mockReturnValue({ id: '123' })
      mockContent.updateItem.mockReturnValue({ id: '123', _meta: { draft: false } })
      mockShouldFireWebhook.mockReturnValue(true)

      await app.request('/posts/123', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ draft: 0 }),
      })

      expect(mockFireWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'content.updated',
          schema: 'posts',
          id: '123',
        })
      )
    })
  })

  describe('DELETE /:schema/:id', () => {
    it('deletes item and returns success', async () => {
      mockContent.getItem.mockReturnValue({ id: '123', _meta: { draft: false } })
      mockContent.deleteItem.mockReturnValue(true)
      mockShouldFireWebhook.mockReturnValue(true)

      const res = await app.request('/posts/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.success).toBe(true)
    })

    it('requires authentication', async () => {
      const res = await app.request('/posts/123', {
        method: 'DELETE',
      })

      expect(res.status).toBe(401)
    })

    it('returns 404 for missing item', async () => {
      mockContent.deleteItem.mockReturnValue(false)

      const res = await app.request('/posts/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(404)
    })

    it('returns 404 for singleton', async () => {
      const res = await app.request('/settings/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(404)
    })

    it('fires webhook when deleting published item', async () => {
      mockContent.getItem.mockReturnValue({ id: '123', _meta: { draft: false } })
      mockContent.deleteItem.mockReturnValue(true)
      mockShouldFireWebhook.mockReturnValue(true)

      await app.request('/posts/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(mockFireWebhook).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'content.deleted',
          schema: 'posts',
          id: '123',
        })
      )
    })

    it('does not fire webhook for draft deletion', async () => {
      mockContent.getItem.mockReturnValue({ id: '123', _meta: { draft: true } })
      mockContent.deleteItem.mockReturnValue(true)
      mockShouldFireWebhook.mockReturnValue(false)

      await app.request('/posts/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(mockFireWebhook).not.toHaveBeenCalled()
    })
  })
})
