import { describe, it, expect } from 'vitest'
import { validateSchema, defineCollection, f } from './schema'

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
