// src/server/lib/schemaLoader.test.ts
import { describe, it, expect } from 'vitest'
import { validateSchemas } from './schemaLoader'
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
})
