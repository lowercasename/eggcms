// src/server/lib/schemaLoader.test.ts
import { describe, it, expect } from 'vitest'
import { validateSchemas, resolveBlockReferences } from './schemaLoader'
import type { SchemaDefinition } from '../../lib/schema'

describe('schemaLoader', () => {
  describe('validateSchemas', () => {
    it('accepts valid collection schema', () => {
      const schemas = [
        { name: 'posts', label: 'Posts', type: 'collection', fields: [] },
      ]

      const result = validateSchemas(schemas)

      expect(result).toEqual(schemas)
    })

    it('accepts valid singleton schema', () => {
      const schemas = [
        { name: 'settings', label: 'Settings', type: 'singleton', fields: [] },
      ]

      const result = validateSchemas(schemas)

      expect(result).toEqual(schemas)
    })

    it('accepts valid block schema', () => {
      const schemas = [
        { name: 'hero', label: 'Hero Block', type: 'block', fields: [] },
      ]

      const result = validateSchemas(schemas)

      expect(result).toEqual(schemas)
    })

    it('accepts schema with fields', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'posts',
          label: 'Posts',
          type: 'collection',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'content', type: 'richtext' },
          ],
        },
      ]

      const result = validateSchemas(schemas)

      expect(result).toEqual(schemas)
    })

    it('accepts multiple schemas', () => {
      const schemas = [
        { name: 'posts', label: 'Posts', type: 'collection', fields: [] },
        { name: 'settings', label: 'Settings', type: 'singleton', fields: [] },
        { name: 'hero', label: 'Hero', type: 'block', fields: [] },
      ]

      const result = validateSchemas(schemas)

      expect(result).toHaveLength(3)
    })

    it('throws when schemas is not an array', () => {
      expect(() => validateSchemas({ name: 'test' })).toThrow(/must be exported as a default array/i)
    })

    it('throws when schema is missing name', () => {
      const schemas = [
        { label: 'Posts', type: 'collection', fields: [] },
      ]

      expect(() => validateSchemas(schemas)).toThrow(/missing or invalid 'name'/i)
    })

    it('throws when schema is missing label', () => {
      const schemas = [
        { name: 'posts', type: 'collection', fields: [] },
      ]

      expect(() => validateSchemas(schemas)).toThrow(/missing or invalid 'label'/i)
    })

    it('throws when schema is missing type', () => {
      const schemas = [
        { name: 'posts', label: 'Posts', fields: [] },
      ]

      expect(() => validateSchemas(schemas)).toThrow(/missing or invalid 'type'/i)
    })

    it('throws when schema type is invalid', () => {
      const schemas = [
        { name: 'posts', label: 'Posts', type: 'invalid', fields: [] },
      ]

      expect(() => validateSchemas(schemas)).toThrow(/invalid schema type 'invalid'/i)
    })

    it('throws when fields is not an array', () => {
      const schemas = [
        { name: 'posts', label: 'Posts', type: 'collection', fields: 'not-an-array' },
      ]

      expect(() => validateSchemas(schemas)).toThrow(/'fields' must be an array/i)
    })

    it('throws when schema is null', () => {
      const schemas = [null]

      expect(() => validateSchemas(schemas)).toThrow(/must be an object/i)
    })

    it('includes schema name in error for identified schemas', () => {
      const schemas = [
        { name: 'mySchema', label: 'Test', type: 'invalid', fields: [] },
      ]

      expect(() => validateSchemas(schemas)).toThrow(/mySchema/)
    })

    it('includes index in error message', () => {
      const schemas = [
        { name: 'valid', label: 'Valid', type: 'collection', fields: [] },
        { name: 'invalid' }, // missing label, type, fields
      ]

      expect(() => validateSchemas(schemas)).toThrow(/index 1/)
    })
  })

  describe('resolveBlockReferences', () => {
    it('resolves blocks array from string names to block definitions', () => {
      const heroBlock: SchemaDefinition = {
        name: 'heroBlock',
        label: 'Hero',
        type: 'block',
        fields: [{ name: 'title', type: 'string' }],
      }

      const schemas: SchemaDefinition[] = [
        {
          name: 'page',
          label: 'Pages',
          type: 'collection',
          fields: [
            { name: 'blocks', type: 'blocks', blocks: ['heroBlock'] as unknown as SchemaDefinition[] },
          ],
        },
        heroBlock,
      ]

      const result = resolveBlockReferences(schemas)

      const pageSchema = result.find(s => s.name === 'page')!
      const blocksField = pageSchema.fields.find(f => f.name === 'blocks')!
      expect(blocksField.blocks).toEqual([heroBlock])
    })

    it('resolves single block reference from string to block definition', () => {
      const imageBlock: SchemaDefinition = {
        name: 'imageBlock',
        label: 'Image',
        type: 'block',
        fields: [{ name: 'src', type: 'string' }],
      }

      const schemas: SchemaDefinition[] = [
        {
          name: 'post',
          label: 'Posts',
          type: 'collection',
          fields: [
            { name: 'featuredImage', type: 'block', block: 'imageBlock' as unknown as SchemaDefinition },
          ],
        },
        imageBlock,
      ]

      const result = resolveBlockReferences(schemas)

      const postSchema = result.find(s => s.name === 'post')!
      const blockField = postSchema.fields.find(f => f.name === 'featuredImage')!
      expect(blockField.block).toEqual(imageBlock)
    })

    it('leaves already-resolved block objects unchanged', () => {
      const heroBlock: SchemaDefinition = {
        name: 'heroBlock',
        label: 'Hero',
        type: 'block',
        fields: [],
      }

      const schemas: SchemaDefinition[] = [
        {
          name: 'page',
          label: 'Pages',
          type: 'collection',
          fields: [
            { name: 'blocks', type: 'blocks', blocks: [heroBlock] },
          ],
        },
        heroBlock,
      ]

      const result = resolveBlockReferences(schemas)

      const pageSchema = result.find(s => s.name === 'page')!
      const blocksField = pageSchema.fields.find(f => f.name === 'blocks')!
      expect(blocksField.blocks).toEqual([heroBlock])
    })

    it('throws when referenced block is not found', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'page',
          label: 'Pages',
          type: 'collection',
          fields: [
            { name: 'blocks', type: 'blocks', blocks: ['nonExistentBlock'] as unknown as SchemaDefinition[] },
          ],
        },
      ]

      expect(() => resolveBlockReferences(schemas)).toThrow(/Block 'nonExistentBlock' referenced.*not found/)
    })

    it('throws when single block reference is not found', () => {
      const schemas: SchemaDefinition[] = [
        {
          name: 'post',
          label: 'Posts',
          type: 'collection',
          fields: [
            { name: 'hero', type: 'block', block: 'missingBlock' as unknown as SchemaDefinition },
          ],
        },
      ]

      expect(() => resolveBlockReferences(schemas)).toThrow(/Block 'missingBlock' referenced.*not found/)
    })

    it('resolves multiple block references in same field', () => {
      const heroBlock: SchemaDefinition = {
        name: 'heroBlock',
        label: 'Hero',
        type: 'block',
        fields: [],
      }
      const textBlock: SchemaDefinition = {
        name: 'textBlock',
        label: 'Text',
        type: 'block',
        fields: [],
      }

      const schemas: SchemaDefinition[] = [
        {
          name: 'page',
          label: 'Pages',
          type: 'collection',
          fields: [
            { name: 'blocks', type: 'blocks', blocks: ['heroBlock', 'textBlock'] as unknown as SchemaDefinition[] },
          ],
        },
        heroBlock,
        textBlock,
      ]

      const result = resolveBlockReferences(schemas)

      const pageSchema = result.find(s => s.name === 'page')!
      const blocksField = pageSchema.fields.find(f => f.name === 'blocks')!
      expect(blocksField.blocks).toEqual([heroBlock, textBlock])
    })
  })
})
