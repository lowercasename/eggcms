// src/server/lib/schemaLoader.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateSchemas, resolveBlockReferences, parseYamlSchemas } from './schemaLoader'
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

  describe('parseYamlSchemas', () => {
    it('parses a simple YAML schema', () => {
      const yaml = `
- name: post
  label: Blog Posts
  type: collection
  fields:
    - name: title
      type: string
      required: true
    - name: content
      type: richtext
`
      const result = parseYamlSchemas(yaml)

      expect(result).toEqual([
        {
          name: 'post',
          label: 'Blog Posts',
          type: 'collection',
          fields: [
            { name: 'title', type: 'string', required: true },
            { name: 'content', type: 'richtext' },
          ],
        },
      ])
    })

    it('parses multiple schemas including blocks', () => {
      const yaml = `
- name: settings
  label: Site Settings
  type: singleton
  fields:
    - name: siteName
      type: string
      required: true

- name: post
  label: Blog Posts
  type: collection
  fields:
    - name: title
      type: string
      required: true

- name: heroBlock
  label: Hero
  type: block
  fields:
    - name: heading
      type: string
      required: true
`
      const result = parseYamlSchemas(yaml)

      expect(result).toHaveLength(3)
      expect(result[0].type).toBe('singleton')
      expect(result[1].type).toBe('collection')
      expect(result[2].type).toBe('block')
    })

    it('parses blocks field references as string arrays', () => {
      const yaml = `
- name: page
  label: Pages
  type: collection
  fields:
    - name: blocks
      type: blocks
      blocks:
        - heroBlock
        - textBlock
`
      const result = parseYamlSchemas(yaml)

      const blocksField = result[0].fields[0]
      expect(blocksField.blocks).toEqual(['heroBlock', 'textBlock'])
    })

    it('parses schema with labelField', () => {
      const yaml = `
- name: person
  label: Team
  type: collection
  labelField: name
  fields:
    - name: name
      type: string
      required: true
`
      const result = parseYamlSchemas(yaml)

      expect(result[0].labelField).toBe('name')
    })

    it('parses select field with options', () => {
      const yaml = `
- name: post
  label: Posts
  type: collection
  fields:
    - name: status
      type: select
      options:
        - draft
        - published
        - archived
      default: draft
`
      const result = parseYamlSchemas(yaml)

      const field = result[0].fields[0]
      expect(field.options).toEqual(['draft', 'published', 'archived'])
      expect(field.default).toBe('draft')
    })

    it('throws on invalid YAML', () => {
      const yaml = `
- name: post
  label: [invalid
`
      expect(() => parseYamlSchemas(yaml)).toThrow()
    })

    it('throws when YAML does not contain an array', () => {
      const yaml = `
name: post
label: Blog Posts
`
      expect(() => parseYamlSchemas(yaml)).toThrow(/must be a YAML array/)
    })
  })
})
