import { describe, it, expect } from 'vitest'
import { validateSchema, defineCollection, defineBlock, f, FIELD_TYPES } from './schema'

describe('validateSchema', () => {
  it('rejects reserved field names', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('id')],
    })
    expect(() => validateSchema(schema)).toThrow('Field \'id\' is reserved')
  })

  it('rejects duplicate field names', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('title'), f.string('title')],
    })
    expect(() => validateSchema(schema)).toThrow('Field \'title\' defined twice')
  })

  it('requires from option for slug fields', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.string('slug', { type: 'slug' } as any)],
    })
    expect(() => validateSchema(schema)).toThrow('requires \'from\' option')
  })

  it('accepts valid schema', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [
        f.string('title', { required: true }),
        f.slug('slug', { from: 'title' }),
      ],
    })
    expect(() => validateSchema(schema)).not.toThrow()
  })

  describe('link field', () => {
    it('creates a valid link field definition', () => {
      const field = f.link('cta')
      expect(field).toEqual({ name: 'cta', type: 'link' })
    })

    it('creates a link field with collections restriction', () => {
      const field = f.link('cta', { collections: ['pages', 'posts'] })
      expect(field).toEqual({ name: 'cta', type: 'link', collections: ['pages', 'posts'] })
    })

    it('accepts link field in schema validation', () => {
      const schema = defineCollection({
        name: 'post',
        label: 'Posts',
        fields: [
          f.string('title'),
          f.link('cta'),
        ],
      })
      expect(() => validateSchema(schema)).not.toThrow()
    })

    it('accepts link field with collections in schema validation', () => {
      const schema = defineCollection({
        name: 'post',
        label: 'Posts',
        fields: [
          f.string('title'),
          f.link('cta', { collections: ['pages'] }),
        ],
      })
      expect(() => validateSchema(schema)).not.toThrow()
    })
  })
})

describe('validateSchema checks what the admin can actually edit', () => {
  it('rejects a field type the admin has no editor for', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [{ name: 'body', type: 'markdown' } as any],
    })
    expect(() => validateSchema(schema)).toThrow("Field 'body' has unknown type 'markdown'")
  })

  it('rejects an unknown rich text toolbar option', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.richtext('body', { toolbar: 'compact' as any })],
    })
    expect(() => validateSchema(schema)).toThrow("Richtext field 'body' has unknown toolbar 'compact'")
  })

  it('rejects an unknown media kind on a file field', () => {
    const schema = defineCollection({
      name: 'post',
      label: 'Posts',
      fields: [f.file('sheet', { kinds: ['spreadsheet'] as any })],
    })
    expect(() => validateSchema(schema)).toThrow("File field 'sheet' has unknown kind 'spreadsheet'")
  })

  it('rejects a field named _id, which blocks use for their own ids', () => {
    const schema = defineCollection({ name: 'post', label: 'Posts', fields: [f.string('_id')] })
    expect(() => validateSchema(schema)).toThrow("Field '_id' is reserved")
  })

  it('lists every field type once', () => {
    expect(FIELD_TYPES).toContain('richtext')
    expect(new Set(FIELD_TYPES).size).toBe(FIELD_TYPES.length)
  })
})

describe('block presentation hints live on the block definition', () => {
  it('defineBlock accepts icon and description', () => {
    const block = defineBlock({ name: 'book', label: 'Book', icon: 'book-open', description: 'A book', fields: [f.string('title')] })
    expect(block.icon).toBe('book-open')
    expect(block.type).toBe('block')
  })
})
