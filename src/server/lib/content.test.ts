// src/server/lib/content.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SchemaDefinition } from '../../lib/schema'

// Mock the sqlite database
const mockPrepare = vi.fn()
const mockRun = vi.fn()
const mockGet = vi.fn()
const mockAll = vi.fn()

vi.mock('../db', () => ({
  sqlite: {
    prepare: (sql: string) => {
      mockPrepare(sql)
      return {
        run: mockRun,
        get: mockGet,
        all: mockAll,
      }
    },
  },
}))

// Mock crypto.randomUUID
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal() as object
  return {
    ...actual,
    randomUUID: () => 'test-uuid-123',
  }
})

// Import after mocks are set up
import {
  getSchema,
  listItems,
  getItem,
  getSingleton,
  createItem,
  updateItem,
  deleteItem,
  upsertSingleton,
} from './content'

describe('content', () => {
  const collectionSchema: SchemaDefinition = {
    name: 'posts',
    label: 'Posts',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'content', type: 'richtext' },
      { name: 'isPublished', type: 'boolean' },
    ],
  }

  const singletonSchema: SchemaDefinition = {
    name: 'settings',
    label: 'Settings',
    type: 'singleton',
    fields: [
      { name: 'siteName', type: 'string', required: true },
      { name: 'darkMode', type: 'boolean' },
    ],
  }

  const schemaWithBlocks: SchemaDefinition = {
    name: 'pages',
    label: 'Pages',
    type: 'collection',
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'blocks', type: 'blocks' },
      { name: 'featuredImage', type: 'block' },
    ],
  }

  const blockSchema: SchemaDefinition = {
    name: 'imageBlock',
    label: 'Image Block',
    type: 'block',
    fields: [{ name: 'src', type: 'string' }],
  }

  const allSchemas = [collectionSchema, singletonSchema, schemaWithBlocks, blockSchema]

  beforeEach(() => {
    vi.clearAllMocks()
    mockRun.mockReturnValue({ changes: 1 })
  })

  describe('getSchema', () => {
    it('finds schema by name', () => {
      const result = getSchema(allSchemas, 'posts')
      expect(result).toBe(collectionSchema)
    })

    it('returns undefined for unknown schema', () => {
      const result = getSchema(allSchemas, 'unknown')
      expect(result).toBeUndefined()
    })

    it('excludes block type schemas', () => {
      const result = getSchema(allSchemas, 'imageBlock')
      expect(result).toBeUndefined()
    })

    it('finds singleton schemas', () => {
      const result = getSchema(allSchemas, 'settings')
      expect(result).toBe(singletonSchema)
    })
  })

  describe('listItems', () => {
    it('lists all items including drafts when includeDrafts is true', () => {
      const mockRows = [
        { id: '1', title: 'Post 1', content: 'Content 1', isPublished: 1, draft: 0, created_at: '2026-01-01', updated_at: '2026-01-02' },
        { id: '2', title: 'Post 2', content: 'Content 2', isPublished: 0, draft: 1, created_at: '2026-01-03', updated_at: '2026-01-04' },
      ]
      mockAll.mockReturnValue(mockRows)

      const result = listItems(collectionSchema, true)

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM "posts"  ORDER BY created_at DESC')
      expect(result).toHaveLength(2)
    })

    it('excludes drafts when includeDrafts is false for collections', () => {
      mockAll.mockReturnValue([])

      listItems(collectionSchema, false)

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM "posts" WHERE draft = 0 ORDER BY created_at DESC')
    })

    it('does not add draft clause for singletons', () => {
      mockAll.mockReturnValue([])

      listItems(singletonSchema, false)

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM "settings"  ORDER BY created_at DESC')
    })

    it('deserializes rows with _meta structure', () => {
      const mockRows = [
        { id: '1', title: 'Post 1', content: 'Content', isPublished: 1, draft: 0, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
      ]
      mockAll.mockReturnValue(mockRows)

      const result = listItems(collectionSchema, true) as Array<Record<string, unknown>>

      expect(result[0]).toEqual({
        id: '1',
        title: 'Post 1',
        content: 'Content',
        isPublished: true, // Boolean converted from 1
        _meta: {
          draft: false, // Boolean converted from 0
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      })
    })

    it('converts boolean fields from SQLite integers', () => {
      const mockRows = [
        { id: '1', title: 'Post', content: '', isPublished: 0, draft: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
      ]
      mockAll.mockReturnValue(mockRows)

      const result = listItems(collectionSchema, true) as Array<Record<string, unknown>>

      expect(result[0].isPublished).toBe(false)
      expect((result[0]._meta as Record<string, unknown>).draft).toBe(true)
    })
  })

  describe('getItem', () => {
    it('returns deserialized item when found', () => {
      const mockRow = { id: '123', title: 'Test', content: 'Body', isPublished: 1, draft: 0, created_at: '2026-01-01', updated_at: '2026-01-02' }
      mockGet.mockReturnValue(mockRow)

      const result = getItem(collectionSchema, '123') as Record<string, unknown>

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM "posts" WHERE id = ?')
      expect(result.id).toBe('123')
      expect(result.title).toBe('Test')
      expect(result._meta).toEqual({
        draft: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-02',
      })
    })

    it('returns undefined when item not found', () => {
      mockGet.mockReturnValue(undefined)

      const result = getItem(collectionSchema, 'nonexistent')

      expect(result).toBeUndefined()
    })
  })

  describe('getSingleton', () => {
    it('returns deserialized singleton when found', () => {
      const mockRow = { id: '1', siteName: 'My Site', darkMode: 1, created_at: '2026-01-01', updated_at: '2026-01-02' }
      mockGet.mockReturnValue(mockRow)

      const result = getSingleton(singletonSchema) as Record<string, unknown>

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM "settings" LIMIT 1')
      expect(result.siteName).toBe('My Site')
      expect(result.darkMode).toBe(true) // Boolean converted
      // Singletons don't have draft in _meta
      expect((result._meta as Record<string, unknown>).draft).toBeUndefined()
    })

    it('returns undefined when singleton not found', () => {
      mockGet.mockReturnValue(undefined)

      const result = getSingleton(singletonSchema)

      expect(result).toBeUndefined()
    })
  })

  describe('createItem', () => {
    it('creates item with generated UUID and timestamps', () => {
      const mockCreatedRow = { id: 'test-uuid-123', title: 'New Post', content: '', isPublished: 0, draft: 1, created_at: '2026-01-01', updated_at: '2026-01-01' }
      mockGet.mockReturnValue(mockCreatedRow)

      const result = createItem(collectionSchema, { title: 'New Post', content: '' })

      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "posts"')
      )
      expect(result).toBeDefined()
    })

    it('defaults draft to 1 for collections when not specified', () => {
      mockGet.mockReturnValue({ id: 'test-uuid-123', title: 'Test', draft: 1, created_at: '', updated_at: '' })

      createItem(collectionSchema, { title: 'Test' })

      // Check that draft=1 was included in the values
      expect(mockRun).toHaveBeenCalled()
      const runArgs = mockRun.mock.calls[0]
      // The draft value should be 1 (last before timestamps)
      expect(runArgs).toContain(1)
    })

    it('uses provided draft value for collections', () => {
      mockGet.mockReturnValue({ id: 'test-uuid-123', title: 'Test', draft: 0, created_at: '', updated_at: '' })

      createItem(collectionSchema, { title: 'Test', draft: 0 })

      expect(mockRun).toHaveBeenCalled()
      const runArgs = mockRun.mock.calls[0]
      expect(runArgs).toContain(0)
    })

    it('does not add draft column for singletons', () => {
      mockGet.mockReturnValue({ id: 'test-uuid-123', siteName: 'Test', created_at: '', updated_at: '' })

      createItem(singletonSchema, { siteName: 'Test' })

      const sql = mockPrepare.mock.calls[0][0]
      expect(sql).not.toContain('"draft"')
    })
  })

  describe('updateItem', () => {
    it('updates only provided fields', () => {
      mockGet.mockReturnValue({ id: '123', title: 'Updated', content: 'Old', isPublished: 0, draft: 1, created_at: '', updated_at: '' })

      updateItem(collectionSchema, '123', { title: 'Updated' })

      const sql = mockPrepare.mock.calls[0][0]
      expect(sql).toContain('"title" = ?')
      expect(sql).toContain('"updated_at" = ?')
      expect(sql).not.toContain('"content" = ?')
    })

    it('updates draft status when provided for collections', () => {
      mockGet.mockReturnValue({ id: '123', title: 'Test', draft: 0, created_at: '', updated_at: '' })

      updateItem(collectionSchema, '123', { draft: 0 })

      const sql = mockPrepare.mock.calls[0][0]
      expect(sql).toContain('"draft" = ?')
    })

    it('returns updated item', () => {
      const updatedRow = { id: '123', title: 'Updated Title', content: '', isPublished: 1, draft: 0, created_at: '2026-01-01', updated_at: '2026-01-02' }
      mockGet.mockReturnValue(updatedRow)

      const result = updateItem(collectionSchema, '123', { title: 'Updated Title' }) as Record<string, unknown>

      expect(result.title).toBe('Updated Title')
    })
  })

  describe('deleteItem', () => {
    it('returns true when item was deleted', () => {
      mockRun.mockReturnValue({ changes: 1 })

      const result = deleteItem(collectionSchema, '123')

      expect(mockPrepare).toHaveBeenCalledWith('DELETE FROM "posts" WHERE id = ?')
      expect(result).toBe(true)
    })

    it('returns false when item was not found', () => {
      mockRun.mockReturnValue({ changes: 0 })

      const result = deleteItem(collectionSchema, 'nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('upsertSingleton', () => {
    it('creates singleton when none exists', () => {
      // First call to getSingleton returns undefined
      mockGet.mockReturnValueOnce(undefined)
      // Then createItem's getItem returns the created row
      mockGet.mockReturnValueOnce({ id: 'test-uuid-123', siteName: 'New Site', created_at: '', updated_at: '' })

      const result = upsertSingleton(singletonSchema, { siteName: 'New Site' }) as Record<string, unknown>

      expect(mockPrepare).toHaveBeenCalledWith('SELECT * FROM "settings" LIMIT 1')
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'))
      expect(result.siteName).toBe('New Site')
    })

    it('updates singleton when one exists', () => {
      // First call to getSingleton returns existing
      mockGet.mockReturnValueOnce({ id: 'existing-id', siteName: 'Old Site', created_at: '', updated_at: '' })
      // Then updateItem's getItem returns updated row
      mockGet.mockReturnValueOnce({ id: 'existing-id', siteName: 'Updated Site', created_at: '', updated_at: '' })

      const result = upsertSingleton(singletonSchema, { siteName: 'Updated Site' }) as Record<string, unknown>

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE'))
      expect(result.siteName).toBe('Updated Site')
    })
  })

  describe('JSON field serialization', () => {
    it('serializes blocks field as JSON when creating', () => {
      const blocksData = [{ _type: 'text', _id: '1', content: 'Hello' }]
      mockGet.mockReturnValue({ id: 'test-uuid-123', title: 'Test', blocks: JSON.stringify(blocksData), draft: 1, created_at: '', updated_at: '' })

      createItem(schemaWithBlocks, { title: 'Test', blocks: blocksData })

      const runArgs = mockRun.mock.calls[0]
      expect(runArgs).toContain(JSON.stringify(blocksData))
    })

    it('serializes block field as JSON when creating', () => {
      const blockData = { src: '/image.jpg', alt: 'Test' }
      mockGet.mockReturnValue({ id: 'test-uuid-123', title: 'Test', featuredImage: JSON.stringify(blockData), draft: 1, created_at: '', updated_at: '' })

      createItem(schemaWithBlocks, { title: 'Test', featuredImage: blockData })

      const runArgs = mockRun.mock.calls[0]
      expect(runArgs).toContain(JSON.stringify(blockData))
    })

    it('deserializes blocks field from JSON when reading', () => {
      const blocksData = [{ _type: 'text', _id: '1', content: 'Hello' }]
      mockAll.mockReturnValue([
        { id: '1', title: 'Test', blocks: JSON.stringify(blocksData), featuredImage: null, draft: 0, created_at: '', updated_at: '' },
      ])

      const result = listItems(schemaWithBlocks, true) as Array<Record<string, unknown>>

      expect(result[0].blocks).toEqual(blocksData)
    })

    it('deserializes block field from JSON when reading', () => {
      const blockData = { src: '/image.jpg', alt: 'Test' }
      mockAll.mockReturnValue([
        { id: '1', title: 'Test', blocks: null, featuredImage: JSON.stringify(blockData), draft: 0, created_at: '', updated_at: '' },
      ])

      const result = listItems(schemaWithBlocks, true) as Array<Record<string, unknown>>

      expect(result[0].featuredImage).toEqual(blockData)
    })

    it('handles invalid JSON gracefully', () => {
      mockAll.mockReturnValue([
        { id: '1', title: 'Test', blocks: 'not valid json', featuredImage: null, draft: 0, created_at: '', updated_at: '' },
      ])

      const result = listItems(schemaWithBlocks, true) as Array<Record<string, unknown>>

      // Should return the raw string instead of crashing
      expect(result[0].blocks).toBe('not valid json')
    })
  })

  describe('_meta structure', () => {
    it('includes draft in _meta for collections', () => {
      mockGet.mockReturnValue({ id: '1', title: 'Test', content: '', isPublished: 0, draft: 1, created_at: '2026-01-01', updated_at: '2026-01-02' })

      const result = getItem(collectionSchema, '1') as Record<string, unknown>
      const meta = result._meta as Record<string, unknown>

      expect(meta.draft).toBe(true)
      expect(meta.createdAt).toBe('2026-01-01')
      expect(meta.updatedAt).toBe('2026-01-02')
    })

    it('excludes draft from _meta for singletons', () => {
      mockGet.mockReturnValue({ id: '1', siteName: 'Test', darkMode: 0, created_at: '2026-01-01', updated_at: '2026-01-02' })

      const result = getSingleton(singletonSchema) as Record<string, unknown>
      const meta = result._meta as Record<string, unknown>

      expect(meta).not.toHaveProperty('draft')
      expect(meta.createdAt).toBe('2026-01-01')
      expect(meta.updatedAt).toBe('2026-01-02')
    })
  })
})
