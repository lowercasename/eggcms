// src/server/routes/schemas.test.ts
import { describe, it, expect } from 'vitest'
import type { SchemaDefinition } from '../../lib/schema'
import { createSchemasRoute } from './schemas'

describe('schemas route', () => {
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
    {
      name: 'heroBlock',
      label: 'Hero Block',
      type: 'block',
      fields: [
        { name: 'heading', type: 'string' },
      ],
    },
  ]

  describe('GET /schemas', () => {
    it('returns schemas without authentication (public endpoint)', async () => {
      const app = createSchemasRoute(testSchemas)
      const res = await app.request('/schemas')

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toHaveLength(2) // Excludes block type
      expect(json.data[0].name).toBe('posts')
      expect(json.data[1].name).toBe('settings')
    })

    it('excludes block type schemas from response', async () => {
      const app = createSchemasRoute(testSchemas)
      const res = await app.request('/schemas')

      const json = await res.json()
      const blockSchema = json.data.find((s: { name: string }) => s.name === 'heroBlock')
      expect(blockSchema).toBeUndefined()
    })

    it('includes field definitions', async () => {
      const app = createSchemasRoute(testSchemas)
      const res = await app.request('/schemas')

      const json = await res.json()
      const postsSchema = json.data.find((s: { name: string }) => s.name === 'posts')
      expect(postsSchema.fields).toHaveLength(2)
      expect(postsSchema.fields[0].name).toBe('title')
      expect(postsSchema.fields[0].required).toBe(true)
    })

    it('includes labelField when present', async () => {
      const schemasWithLabelField: SchemaDefinition[] = [
        {
          name: 'people',
          label: 'People',
          type: 'collection',
          labelField: 'firstName',
          fields: [{ name: 'firstName', type: 'string' }],
        },
      ]
      const app = createSchemasRoute(schemasWithLabelField)
      const res = await app.request('/schemas')

      const json = await res.json()
      expect(json.data[0].labelField).toBe('firstName')
    })

    it('includes nested block definitions in blocks fields', async () => {
      const schemasWithBlocks: SchemaDefinition[] = [
        {
          name: 'page',
          label: 'Pages',
          type: 'collection',
          fields: [
            {
              name: 'content',
              type: 'blocks',
              blocks: [
                {
                  name: 'textBlock',
                  label: 'Text Block',
                  type: 'block',
                  fields: [{ name: 'text', type: 'richtext' }],
                },
              ],
            },
          ],
        },
      ]
      const app = createSchemasRoute(schemasWithBlocks)
      const res = await app.request('/schemas')

      const json = await res.json()
      const blocksField = json.data[0].fields[0]
      expect(blocksField.blocks).toHaveLength(1)
      expect(blocksField.blocks[0].name).toBe('textBlock')
      expect(blocksField.blocks[0].fields).toHaveLength(1)
    })
  })
})
