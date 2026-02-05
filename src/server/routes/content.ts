// src/server/routes/content.ts
import { Hono } from 'hono'
import { requireAuth, optionalAuth } from '../middleware/auth'
import * as content from '../lib/content'
import { fireWebhook, shouldFireWebhook } from '../lib/webhook'
import type { SchemaDefinition } from '../../lib/schema'

type Variables = {
  user?: { email: string }
}

export function createContentRoutes(schemas: SchemaDefinition[]) {
  const app = new Hono<{ Variables: Variables }>()

  // GET /api/content/:schema - List or get singleton
  app.get('/:schema', optionalAuth, (c) => {
    const schemaName = c.req.param('schema')
    const schema = content.getSchema(schemas, schemaName)

    if (!schema) {
      return c.json({ error: { code: 'NOT_FOUND', message: `Schema '${schemaName}' not found` } }, 404)
    }

    const user = c.get('user')
    const publicApi = process.env.PUBLIC_API !== 'false'

    if (!publicApi && !user) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    }

    if (schema.type === 'singleton') {
      const data = content.getSingleton(schema)
      return c.json({ data: data || {} })
    }

    const includeDrafts = c.req.query('drafts') === 'true' && !!user
    const items = content.listItems(schema, includeDrafts)
    return c.json({ data: items, meta: { total: items.length } })
  })

  // GET /api/content/:schema/:id - Get single item
  app.get('/:schema/:id', optionalAuth, (c) => {
    const schemaName = c.req.param('schema')
    const id = c.req.param('id') // UUID string
    const schema = content.getSchema(schemas, schemaName)

    if (!schema || schema.type === 'singleton') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404)
    }

    const user = c.get('user')
    const publicApi = process.env.PUBLIC_API !== 'false'

    if (!publicApi && !user) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
    }

    const item = content.getItem(schema, id) as { draft?: number } | undefined

    if (!item) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    // Don't expose drafts to public API
    if (item.draft && !user) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    return c.json({ data: item })
  })

  // POST /api/content/:schema - Create item
  app.post('/:schema', requireAuth, async (c) => {
    const schemaName = c.req.param('schema')
    const schema = content.getSchema(schemas, schemaName)

    if (!schema) {
      return c.json({ error: { code: 'NOT_FOUND', message: `Schema '${schemaName}' not found` } }, 404)
    }

    const body = await c.req.json()

    if (schema.type === 'singleton') {
      const data = content.upsertSingleton(schema, body)
      fireWebhook({ event: 'content.updated', schema: schema.name, timestamp: new Date().toISOString() })
      return c.json({ data })
    }

    const data = content.createItem(schema, body) as { id: string; draft?: number }
    if (shouldFireWebhook(schema, 'create', data)) {
      fireWebhook({ event: 'content.updated', schema: schema.name, id: data.id, timestamp: new Date().toISOString() })
    }
    return c.json({ data }, 201)
  })

  // PUT /api/content/:schema/:id - Update item
  app.put('/:schema/:id', requireAuth, async (c) => {
    const schemaName = c.req.param('schema')
    const id = c.req.param('id') // UUID string
    const schema = content.getSchema(schemas, schemaName)

    if (!schema || schema.type === 'singleton') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404)
    }

    const existing = content.getItem(schema, id)
    if (!existing) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    const body = await c.req.json()
    const data = content.updateItem(schema, id, body) as { id: string; draft?: number }
    if (shouldFireWebhook(schema, 'update', data)) {
      fireWebhook({ event: 'content.updated', schema: schema.name, id: data.id, timestamp: new Date().toISOString() })
    }
    return c.json({ data })
  })

  // DELETE /api/content/:schema/:id - Delete item
  app.delete('/:schema/:id', requireAuth, (c) => {
    const schemaName = c.req.param('schema')
    const id = c.req.param('id') // UUID string
    const schema = content.getSchema(schemas, schemaName)

    if (!schema || schema.type === 'singleton') {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404)
    }

    const existing = content.getItem(schema, id) as { draft?: number } | undefined
    const deleted = content.deleteItem(schema, id)
    if (!deleted) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Item not found' } }, 404)
    }

    if (shouldFireWebhook(schema, 'delete', existing)) {
      fireWebhook({ event: 'content.deleted', schema: schema.name, id, timestamp: new Date().toISOString() })
    }
    return c.json({ data: { success: true } })
  })

  return app
}
